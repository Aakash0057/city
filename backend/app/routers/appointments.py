from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.dependencies import (
    get_current_user,
    require_patient,
    require_doctor,
    require_admin,
    check_patient_access
)
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.enums import AppointmentStatus, UserRole
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentResponse,
    AppointmentStatusUpdate,
    DoctorSlotsResponse
)
from app.services import appointment_service

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("/available-slots", response_model=DoctorSlotsResponse)
@router.get("/slots/{doctor_id}", response_model=DoctorSlotsResponse)
def get_available_slots(
    doctor_id: Optional[int] = None,
    date: str = Query(..., description="Target date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    return appointment_service.get_available_slots(db=db, doctor_id=doctor_id, date_str=date)


@router.get("/my", response_model=List[AppointmentResponse])
def get_my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns appointments for the authenticated patient or doctor.
    """
    query = db.query(Appointment).options(
        joinedload(Appointment.doctor).joinedload(Doctor.user),
        joinedload(Appointment.patient)
    )
    if current_user.role == UserRole.PATIENT:
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            return []
        query = query.filter(Appointment.doctor_id == doctor.id)
    return query.order_by(Appointment.appointment_date.desc(), Appointment.time_slot.asc()).all()


@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    doctor_id: Optional[int] = None,
    patient_id: Optional[int] = None,
    date: Optional[str] = None,
    status: Optional[AppointmentStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List appointments.
    - DOCTORS only see their own appointments.
    - ADMINS can view all.
    - PATIENTS are forbidden (must use /my to prevent cross-patient enumeration).
    """
    if current_user.role == UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: patients must use the /appointments/my endpoint."
        )

    query = db.query(Appointment).options(
        joinedload(Appointment.doctor).joinedload(Doctor.user),
        joinedload(Appointment.patient)
    )

    if current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            return []
        query = query.filter(Appointment.doctor_id == doctor.id)
    elif current_user.role == UserRole.ADMIN and doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)

    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    if date:
        query = query.filter(Appointment.appointment_date == date)
    if status:
        query = query.filter(Appointment.status == status)

    return query.order_by(Appointment.appointment_date.desc(), Appointment.time_slot.asc()).all()


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    # Authenticated patient books for themselves
    patient_id = current_user.id
    return appointment_service.book_appointment(
        db=db,
        patient_id=patient_id,
        data=payload,
        ip_address=client_ip
    )


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).options(
        joinedload(Appointment.doctor).joinedload(Doctor.user),
        joinedload(Appointment.patient)
    ).filter(Appointment.id == appointment_id).first()

    if not appointment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    # Cross-patient privacy enforcement: return 403 Forbidden (not empty list)
    if current_user.role == UserRole.PATIENT and appointment.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view another patient's appointment."
        )

    if current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor and appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: appointment belongs to another clinical practitioner."
            )

    return appointment


@router.put("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    return appointment_service.cancel_appointment(
        db=db,
        appointment_id=appointment_id,
        user=current_user,
        ip_address=client_ip
    )


@router.put("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    appointment_id: int,
    payload: AppointmentReschedule,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    return appointment_service.reschedule_appointment(
        db=db,
        appointment_id=appointment_id,
        user=current_user,
        data=payload,
        ip_address=client_ip
    )


@router.put("/{appointment_id}/status", response_model=AppointmentResponse)
def update_status(
    appointment_id: int,
    payload: AppointmentStatusUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patients cannot modify clinical appointment status."
        )
    client_ip = request.client.host if request.client else "unknown"
    return appointment_service.update_appointment_status(
        db=db,
        appointment_id=appointment_id,
        user=current_user,
        data=payload,
        ip_address=client_ip
    )
