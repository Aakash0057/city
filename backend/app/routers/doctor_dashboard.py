from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.dependencies import get_current_doctor, require_doctor
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.emergency import EmergencyRequest
from app.models.enums import AppointmentStatus, EmergencyStatus, LabOrderStatus, PrescriptionStatus
from app.models.laboratory import LabOrder
from app.models.pharmacy import Prescription
from app.models.user import User
from app.schemas.appointment import AppointmentResponse
from app.schemas.emergency import EmergencyResponse
from app.schemas.laboratory import LabOrderResponse
from app.schemas.pharmacy import PrescriptionResponse
from app.services import emergency_service

router = APIRouter(prefix="/doctor", tags=["Doctor Dashboard Module"])


@router.get("/dashboard")
def get_doctor_dashboard(
    doctor: Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 1. Today's Appointments
    today_appointments = db.query(Appointment).options(
        joinedload(Appointment.patient),
        joinedload(Appointment.doctor).joinedload(Doctor.user)
    ).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date == today_str
    ).order_by(Appointment.time_slot.asc()).all()

    # 2. Live Emergency Queue
    emergency_queue = emergency_service.get_emergency_queue(db=db, include_resolved=False)

    # 3. Pending Lab Orders
    pending_labs = db.query(LabOrder).options(
        joinedload(LabOrder.test),
        joinedload(LabOrder.patient),
        joinedload(LabOrder.doctor).joinedload(Doctor.user)
    ).filter(
        LabOrder.doctor_id == doctor.id,
        LabOrder.status.in_([LabOrderStatus.ORDERED, LabOrderStatus.SAMPLE_COLLECTED])
    ).order_by(LabOrder.created_at.desc()).all()

    # 4. Recent Prescriptions
    recent_prescriptions = db.query(Prescription).options(
        joinedload(Prescription.patient),
        joinedload(Prescription.items),
        joinedload(Prescription.doctor).joinedload(Doctor.user)
    ).filter(
        Prescription.doctor_id == doctor.id
    ).order_by(Prescription.created_at.desc()).limit(5).all()

    return {
        "doctor_profile": {
            "id": doctor.id,
            "name": doctor.user.full_name,
            "specialty": doctor.specialty,
            "room_number": doctor.room_number,
            "consultation_fee": doctor.consultation_fee
        },
        "stats": {
            "today_appointments_count": len(today_appointments),
            "emergency_queue_count": len(emergency_queue),
            "pending_lab_count": len(pending_labs),
            "active_prescriptions_count": db.query(Prescription).filter(
                Prescription.doctor_id == doctor.id,
                Prescription.status == PrescriptionStatus.ACTIVE
            ).count()
        },
        "today_appointments": [AppointmentResponse.model_validate(a) for a in today_appointments],
        "emergency_queue": [EmergencyResponse.model_validate(e) for e in emergency_queue[:5]],
        "pending_lab_orders": [LabOrderResponse.model_validate(l) for l in pending_labs],
        "recent_prescriptions": [PrescriptionResponse.model_validate(p) for p in recent_prescriptions]
    }
