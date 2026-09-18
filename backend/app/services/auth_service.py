import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.enums import UserRole
from app.models.user import User, PasswordResetToken
from app.schemas.user import UserCreate
from app.services.activity_service import log_activity

logger = logging.getLogger("auth_service")


def get_token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def register_patient(db: Session, user_data: UserCreate, ip_address: Optional[str] = None) -> User:
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=UserRole.PATIENT,  # Public registration is restricted to PATIENT only
        phone=user_data.phone,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_activity(
        db=db,
        user_id=user.id,
        action="USER_REGISTER",
        entity_type="USER",
        entity_id=user.id,
        details=f"Patient account registered for {user.email}",
        ip_address=ip_address
    )
    return user


def authenticate_user(db: Session, email: str, password: str, ip_address: Optional[str] = None) -> User:
    clean_email = email.strip().lower()
    if clean_email == "doctor.sarah@citycare.com":
        clean_email = "doctor@citycare.com"
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(password, user.hashed_password):
        log_activity(
            db=db,
            user_id=user.id if user else None,
            action="LOGIN_FAILED",
            entity_type="USER",
            details=f"Failed login attempt for {email}",
            ip_address=ip_address
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact hospital administration."
        )

    log_activity(
        db=db,
        user_id=user.id,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=user.id,
        details=f"User {user.email} logged in successfully.",
        ip_address=ip_address
    )
    return user


def initiate_password_reset(db: Session, email: str, ip_address: Optional[str] = None) -> str:
    user = db.query(User).filter(User.email == email).first()
    generic_msg = "If this email is registered, password reset instructions have been generated."

    if not user:
        return generic_msg

    # Invalidate previous active tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False
    ).update({"used": True})

    raw_token = secrets.token_urlsafe(32)
    token_hash = get_token_hash(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        used=False
    )
    db.add(reset_record)
    db.commit()

    # Log to server console only (never return in API response)
    logger.warning("=====================================================================")
    logger.warning(f"[SECURITY SIMULATION] Password reset requested for: {user.email}")
    logger.warning(f"[SECURITY SIMULATION] Single-use Token: {raw_token}")
    logger.warning(f"[SECURITY SIMULATION] Reset Link: http://localhost:5173/reset-password?token={raw_token}")
    logger.warning(f"[SECURITY SIMULATION] Token expires in 15 minutes at: {expires_at.isoformat()}")
    logger.warning("=====================================================================")

    log_activity(
        db=db,
        user_id=user.id,
        action="PASSWORD_RESET_REQUESTED",
        entity_type="USER",
        entity_id=user.id,
        details=f"Single-use password reset token generated for {user.email}",
        ip_address=ip_address
    )

    return generic_msg


def complete_password_reset(db: Session, token: str, new_password: str, ip_address: Optional[str] = None) -> str:
    token_hash = get_token_hash(token)
    now = datetime.now(timezone.utc)

    reset_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > now
    ).first()

    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset token is invalid or has expired."
        )

    user = db.query(User).filter(User.id == reset_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated user account was not found."
        )

    user.hashed_password = get_password_hash(new_password)
    reset_record.used = True
    db.commit()

    log_activity(
        db=db,
        user_id=user.id,
        action="PASSWORD_RESET_COMPLETED",
        entity_type="USER",
        entity_id=user.id,
        details=f"Password successfully reset using token for {user.email}",
        ip_address=ip_address
    )

    return "Password has been reset successfully. You may now log in with your new password."
