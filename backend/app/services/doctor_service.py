from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.doctor import Doctor
from app.models.user import User
from app.schemas.doctor import DoctorCreate, DoctorUpdate


def get_doctors(
    db: Session,
    specialty: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Doctor]:
    query = db.query(Doctor).options(joinedload(Doctor.user))
    if specialty and specialty.lower() != "all":
        query = query.filter(Doctor.specialty.ilike(f"%{specialty}%"))
    if search:
        query = query.join(Doctor.user).filter(
            (User.full_name.ilike(f"%{search}%")) |
            (Doctor.specialty.ilike(f"%{search}%")) |
            (Doctor.bio.ilike(f"%{search}%"))
        )
    return query.offset(skip).limit(limit).all()


def get_doctor_by_id(db: Session, doctor_id: int) -> Doctor:
    doctor = db.query(Doctor).options(joinedload(Doctor.user)).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {doctor_id} not found."
        )
    return doctor


def get_specialties(db: Session) -> List[str]:
    records = db.query(Doctor.specialty).distinct().all()
    return [r[0] for r in records if r[0]]
