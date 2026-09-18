from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.dependencies import get_current_user, require_doctor, require_clinical
from app.models.doctor import Doctor
from app.models.enums import LabOrderStatus, UserRole
from app.models.laboratory import LabOrder, LabTest
from app.models.user import User
from app.schemas.laboratory import (
    LabOrderCreate,
    LabOrderResponse,
    LabOrderResultEntry,
    LabTestCreate,
    LabTestResponse
)
from app.services import laboratory_service

router = APIRouter(prefix="/laboratory", tags=["Laboratory Module"])


@router.get("/tests", response_model=List[LabTestResponse])
def list_lab_tests(db: Session = Depends(get_db)):
    return laboratory_service.get_lab_tests(db=db)


@router.get("/orders/my", response_model=List[LabOrderResponse])
def get_my_lab_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(LabOrder).options(
        joinedload(LabOrder.test),
        joinedload(LabOrder.doctor).joinedload(Doctor.user),
        joinedload(LabOrder.patient)
    )
    if current_user.role == UserRole.PATIENT:
        query = query.filter(LabOrder.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            return []
        query = query.filter(LabOrder.doctor_id == doctor.id)
    return query.order_by(LabOrder.created_at.desc()).all()


@router.get("/orders", response_model=List[LabOrderResponse])
def list_all_lab_orders(
    status_filter: Optional[LabOrderStatus] = Query(None, alias="status"),
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Enforce RBAC: Patients must use /orders/my
    if current_user.role == UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: patients must use the /laboratory/orders/my endpoint."
        )

    query = db.query(LabOrder).options(
        joinedload(LabOrder.test),
        joinedload(LabOrder.doctor).joinedload(Doctor.user),
        joinedload(LabOrder.patient)
    )

    if current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(LabOrder.doctor_id == doctor.id)

    if status_filter:
        query = query.filter(LabOrder.status == status_filter)
    if patient_id:
        query = query.filter(LabOrder.patient_id == patient_id)

    return query.order_by(LabOrder.created_at.desc()).all()


@router.post("/orders", response_model=LabOrderResponse, status_code=status.HTTP_201_CREATED)
def create_lab_order(
    payload: LabOrderCreate,
    request: Request,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    return laboratory_service.order_lab_test(
        db=db,
        doctor_user=current_user,
        data=payload,
        ip_address=client_ip
    )


@router.get("/orders/{order_id}", response_model=LabOrderResponse)
def get_lab_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return laboratory_service.get_lab_order_detail(db=db, order_id=order_id, user=current_user)


@router.put("/orders/{order_id}/collect-sample", response_model=LabOrderResponse)
def collect_sample(
    order_id: int,
    request: Request,
    current_user: User = Depends(require_clinical),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    return laboratory_service.collect_sample(
        db=db,
        order_id=order_id,
        user=current_user,
        ip_address=client_ip
    )


@router.put("/orders/{order_id}/result", response_model=LabOrderResponse)
def enter_result(
    order_id: int,
    payload: LabOrderResultEntry,
    request: Request,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    return laboratory_service.enter_lab_result(
        db=db,
        order_id=order_id,
        user=current_user,
        data=payload,
        ip_address=client_ip
    )
