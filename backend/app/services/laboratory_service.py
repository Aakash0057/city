from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.doctor import Doctor
from app.models.enums import LabOrderStatus, UserRole
from app.models.laboratory import LabOrder, LabTest
from app.models.user import User
from app.schemas.laboratory import LabOrderCreate, LabOrderResultEntry
from app.services.activity_service import log_activity


def get_lab_tests(db: Session, active_only: bool = True) -> List[LabTest]:
    query = db.query(LabTest)
    if active_only:
        query = query.filter(LabTest.is_active == True)
    return query.order_by(LabTest.name.asc()).all()


def order_lab_test(
    db: Session,
    doctor_user: User,
    data: LabOrderCreate,
    ip_address: Optional[str] = None
) -> LabOrder:
    doctor = db.query(Doctor).filter(Doctor.user_id == doctor_user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for the authenticated user."
        )

    test = db.query(LabTest).filter(LabTest.id == data.test_id).first()
    if not test:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lab test with ID {data.test_id} not found."
        )

    patient = db.query(User).filter(User.id == data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {data.patient_id} not found."
        )

    order = LabOrder(
        patient_id=data.patient_id,
        doctor_id=doctor.id,
        test_id=data.test_id,
        status=LabOrderStatus.ORDERED,
        notes=data.notes
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    log_activity(
        db=db,
        user_id=doctor_user.id,
        action="ORDER_LAB_TEST",
        entity_type="LAB_ORDER",
        entity_id=order.id,
        details=f"Doctor {doctor_user.full_name} ordered {test.name} for patient #{data.patient_id}",
        ip_address=ip_address
    )
    return order


def collect_sample(
    db: Session,
    order_id: int,
    user: User,
    ip_address: Optional[str] = None
) -> LabOrder:
    order = db.query(LabOrder).filter(LabOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab order not found.")

    order.status = LabOrderStatus.SAMPLE_COLLECTED
    order.sample_collected_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)

    log_activity(
        db=db,
        user_id=user.id,
        action="COLLECT_LAB_SAMPLE",
        entity_type="LAB_ORDER",
        entity_id=order.id,
        details=f"Sample collected for Lab Order #{order.id}",
        ip_address=ip_address
    )
    return order


def enter_lab_result(
    db: Session,
    order_id: int,
    user: User,
    data: LabOrderResultEntry,
    ip_address: Optional[str] = None
) -> LabOrder:
    order = db.query(LabOrder).filter(LabOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab order not found.")

    order.result_text = data.result_text
    order.result_value = data.result_value
    order.is_abnormal = data.is_abnormal
    order.status = LabOrderStatus.COMPLETED
    order.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)

    log_activity(
        db=db,
        user_id=user.id,
        action="RECORD_LAB_RESULT",
        entity_type="LAB_ORDER",
        entity_id=order.id,
        details=f"Result entered for Lab Order #{order.id} (Abnormal: {data.is_abnormal})",
        ip_address=ip_address
    )
    return order


def get_lab_order_detail(
    db: Session,
    order_id: int,
    user: User
) -> LabOrder:
    order = db.query(LabOrder).options(
        joinedload(LabOrder.patient),
        joinedload(LabOrder.doctor).joinedload(Doctor.user),
        joinedload(LabOrder.test)
    ).filter(LabOrder.id == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab order not found.")

    # Cross-patient privacy check
    if user.role == UserRole.PATIENT and order.patient_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view another patient's laboratory results."
        )

    return order
