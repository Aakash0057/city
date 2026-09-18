from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import require_admin
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.doctor import DoctorResponse
from app.services import doctor_service

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.get("", response_model=List[DoctorResponse])
def list_doctors(
    specialty: Optional[str] = Query(None, description="Filter by clinical specialty"),
    search: Optional[str] = Query(None, description="Search by name, specialty, or bio"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return doctor_service.get_doctors(db=db, specialty=specialty, search=search, skip=skip, limit=limit)


@router.get("/specialties", response_model=List[str])
def list_specialties(db: Session = Depends(get_db)):
    return doctor_service.get_specialties(db=db)


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    return doctor_service.get_doctor_by_id(db=db, doctor_id=doctor_id)
