from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.limiter import rate_limit_login, rate_limit_reset
from app.core.security import create_access_token
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.services import auth_service
from app.services.activity_service import log_activity

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    return auth_service.register_patient(db=db, user_data=user_in, ip_address=client_ip)


@router.post("/login", response_model=Token, dependencies=[Depends(rate_limit_login)])
def login(
    credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    user = auth_service.authenticate_user(
        db=db,
        email=credentials.email,
        password=credentials.password,
        ip_address=client_ip
    )
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value, "email": user.email}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/logout")
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    log_activity(
        db=db,
        user_id=current_user.id,
        action="USER_LOGOUT",
        entity_type="USER",
        entity_id=current_user.id,
        details=f"User {current_user.email} logged out.",
        ip_address=client_ip
    )
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", dependencies=[Depends(rate_limit_reset)])
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    msg = auth_service.initiate_password_reset(db=db, email=payload.email, ip_address=client_ip)
    return {"message": msg}


@router.post("/reset-password", dependencies=[Depends(rate_limit_reset)])
def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    msg = auth_service.complete_password_reset(
        db=db,
        token=payload.token,
        new_password=payload.new_password,
        ip_address=client_ip
    )
    return {"message": msg}
