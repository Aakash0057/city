from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import require_admin
from app.models.service import Service
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate

router = APIRouter(prefix="/services", tags=["Hospital Services"])


@router.get("", response_model=List[ServiceResponse])
def list_services(db: Session = Depends(get_db)):
    return db.query(Service).filter(Service.is_active == True).order_by(Service.id.asc()).all()


@router.get("/{service_code}", response_model=ServiceResponse)
def get_service(service_code: str, db: Session = Depends(get_db)):
    service = db.query(Service).filter(
        (Service.code == service_code.upper()) | (Service.id == int(service_code) if service_code.isdigit() else False)
    ).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service '{service_code}' not found."
        )
    return service


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Service).filter(Service.code == service_in.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Service code already exists.")
    service = Service(
        name=service_in.name,
        code=service_in.code.upper(),
        department=service_in.department,
        description=service_in.description,
        icon_name=service_in.icon_name,
        is_active=service_in.is_active
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service
