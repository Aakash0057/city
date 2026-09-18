from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import case
from sqlalchemy.orm import Session, joinedload
from app.models.doctor import Doctor
from app.models.emergency import EmergencyRequest
from app.models.enums import EmergencySeverity, EmergencyStatus
from app.models.user import User
from app.schemas.emergency import EmergencyRequestCreate, EmergencyTriageUpdate
from app.services.activity_service import log_activity


def create_emergency_request(
    db: Session,
    data: EmergencyRequestCreate,
    ip_address: Optional[str] = None
) -> EmergencyRequest:
    req = EmergencyRequest(
        patient_name=data.patient_name,
        patient_phone=data.patient_phone,
        severity=data.severity,
        description=data.description,
        status=EmergencyStatus.WAITING
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    log_activity(
        db=db,
        user_id=None,
        action="EMERGENCY_REQUEST_SUBMITTED",
        entity_type="EMERGENCY",
        entity_id=req.id,
        details=f"Public emergency request registered for {req.patient_name} with severity {req.severity.value}",
        ip_address=ip_address
    )
    return req


def get_emergency_queue(
    db: Session,
    include_resolved: bool = False
) -> List[EmergencyRequest]:
    # Prioritize CRITICAL (1), HIGH (2), MEDIUM (3), LOW (4)
    severity_order = case(
        (EmergencyRequest.severity == EmergencySeverity.CRITICAL, 1),
        (EmergencyRequest.severity == EmergencySeverity.HIGH, 2),
        (EmergencyRequest.severity == EmergencySeverity.MEDIUM, 3),
        (EmergencyRequest.severity == EmergencySeverity.LOW, 4),
        else_=5
    )

    query = db.query(EmergencyRequest).options(
        joinedload(EmergencyRequest.assigned_doctor).joinedload(Doctor.user)
    )

    if not include_resolved:
        query = query.filter(EmergencyRequest.status != EmergencyStatus.RESOLVED)

    return query.order_by(
        severity_order.asc(),
        EmergencyRequest.created_at.asc()
    ).all()


def triage_emergency_request(
    db: Session,
    request_id: int,
    data: EmergencyTriageUpdate,
    user: User,
    ip_address: Optional[str] = None
) -> EmergencyRequest:
    req = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency request #{request_id} not found."
        )

    req.status = data.status
    if data.severity:
        req.severity = data.severity
    if data.assigned_doctor_id is not None:
        req.assigned_doctor_id = data.assigned_doctor_id
    if data.triage_notes:
        req.triage_notes = data.triage_notes

    db.commit()
    db.refresh(req)

    log_activity(
        db=db,
        user_id=user.id,
        action="TRIAGE_EMERGENCY",
        entity_type="EMERGENCY",
        entity_id=req.id,
        details=f"Emergency request #{req.id} updated to status {req.status.value} by {user.email}",
        ip_address=ip_address
    )
    return req
