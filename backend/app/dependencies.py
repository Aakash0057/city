from typing import List, Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.enums import UserRole
from app.models.user import User
from app.models.doctor import Doctor

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id_str: Optional[str] = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return user


def require_roles(allowed_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: role '{current_user.role.value}' does not have sufficient permissions."
            )
        return current_user
    return role_checker


require_patient = require_roles([UserRole.PATIENT])
require_doctor = require_roles([UserRole.DOCTOR])
require_admin = require_roles([UserRole.ADMIN])
require_clinical = require_roles([UserRole.DOCTOR, UserRole.ADMIN])
require_authenticated = require_roles([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN])


def check_patient_access(current_user: User, patient_id: int):
    """
    Enforces cross-patient data isolation.
    A patient can never access another patient's data.
    Returns 403 Forbidden on cross-user access, NOT an empty list.
    """
    if current_user.role == UserRole.PATIENT and current_user.id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view or modify another patient's records."
        )


def get_current_doctor(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor)
) -> Doctor:
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor clinical profile not found for the authenticated user."
        )
    return doctor
