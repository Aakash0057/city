from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.enums import AppointmentStatus, UserRole
from app.models.user import User
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentStatusUpdate,
    TimeSlotAvailability,
    DoctorSlotsResponse
)
from app.services.activity_service import log_activity

STANDARD_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
]


def get_available_slots(db: Session, doctor_id: int, date_str: str) -> DoctorSlotsResponse:
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {doctor_id} not found."
        )

    # Find already booked active slots for this doctor on this date
    booked_appointments = db.query(Appointment.time_slot).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == date_str,
        Appointment.status == AppointmentStatus.SCHEDULED
    ).all()

    booked_slots_set = {b[0] for b in booked_appointments}

    slot_availabilities = [
        TimeSlotAvailability(
            time_slot=s,
            is_available=(s not in booked_slots_set)
        )
        for s in STANDARD_SLOTS
    ]

    return DoctorSlotsResponse(
        doctor_id=doctor_id,
        date=date_str,
        available_slots=slot_availabilities
    )


def book_appointment(
    db: Session,
    patient_id: int,
    data: AppointmentCreate,
    ip_address: Optional[str] = None
) -> Appointment:
    doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Doctor with ID {data.doctor_id} not found."
        )

    # Double-booking check: prevent booking if slot already occupied
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == data.doctor_id,
        Appointment.appointment_date == data.appointment_date,
        Appointment.time_slot == data.time_slot,
        Appointment.status == AppointmentStatus.SCHEDULED
    ).first()

    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This time slot ({data.time_slot}) on {data.appointment_date} is already booked. Please select another slot."
        )

    appointment = Appointment(
        patient_id=patient_id,
        doctor_id=data.doctor_id,
        appointment_date=data.appointment_date,
        time_slot=data.time_slot,
        status=AppointmentStatus.SCHEDULED,
        reason=data.reason,
        notes=data.notes
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    log_activity(
        db=db,
        user_id=patient_id,
        action="BOOK_APPOINTMENT",
        entity_type="APPOINTMENT",
        entity_id=appointment.id,
        details=f"Appointment booked with Doctor ID {data.doctor_id} for {data.appointment_date} at {data.time_slot}",
        ip_address=ip_address
    )
    return appointment


def cancel_appointment(
    db: Session,
    appointment_id: int,
    user: User,
    ip_address: Optional[str] = None
) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment with ID {appointment_id} not found."
        )

    # Ownership check: patient can only cancel their own appointment
    if user.role == UserRole.PATIENT and appointment.patient_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you cannot cancel another patient's appointment."
        )

    if appointment.status == AppointmentStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment is already cancelled."
        )

    appointment.status = AppointmentStatus.CANCELLED
    db.commit()
    db.refresh(appointment)

    log_activity(
        db=db,
        user_id=user.id,
        action="CANCEL_APPOINTMENT",
        entity_type="APPOINTMENT",
        entity_id=appointment.id,
        details=f"Appointment #{appointment.id} cancelled by {user.email}",
        ip_address=ip_address
    )
    return appointment


def reschedule_appointment(
    db: Session,
    appointment_id: int,
    user: User,
    data: AppointmentReschedule,
    ip_address: Optional[str] = None
) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment with ID {appointment_id} not found."
        )

    # Ownership check
    if user.role == UserRole.PATIENT and appointment.patient_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you cannot reschedule another patient's appointment."
        )

    # Conflict check for new slot
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == appointment.doctor_id,
        Appointment.appointment_date == data.appointment_date,
        Appointment.time_slot == data.time_slot,
        Appointment.status == AppointmentStatus.SCHEDULED,
        Appointment.id != appointment_id
    ).first()

    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"The selected time slot ({data.time_slot}) on {data.appointment_date} is unavailable."
        )

    appointment.appointment_date = data.appointment_date
    appointment.time_slot = data.time_slot
    appointment.status = AppointmentStatus.SCHEDULED
    db.commit()
    db.refresh(appointment)

    log_activity(
        db=db,
        user_id=user.id,
        action="RESCHEDULE_APPOINTMENT",
        entity_type="APPOINTMENT",
        entity_id=appointment.id,
        details=f"Appointment #{appointment.id} rescheduled to {data.appointment_date} at {data.time_slot}",
        ip_address=ip_address
    )
    return appointment


def update_appointment_status(
    db: Session,
    appointment_id: int,
    user: User,
    data: AppointmentStatusUpdate,
    ip_address: Optional[str] = None
) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment with ID {appointment_id} not found."
        )

    appointment.status = data.status
    if data.notes:
        appointment.notes = data.notes
    db.commit()
    db.refresh(appointment)

    log_activity(
        db=db,
        user_id=user.id,
        action="UPDATE_APPOINTMENT_STATUS",
        entity_type="APPOINTMENT",
        entity_id=appointment.id,
        details=f"Appointment #{appointment.id} status updated to {data.status.value}",
        ip_address=ip_address
    )
    return appointment
