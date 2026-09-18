from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.dependencies import (
    get_current_user,
    require_doctor,
    require_admin,
    require_clinical
)
from app.models.doctor import Doctor
from app.models.enums import PrescriptionStatus, UserRole
from app.models.pharmacy import Medicine, Prescription, RefillRequest
from app.models.user import User
from app.schemas.pharmacy import (
    MedicineCreate,
    MedicineResponse,
    MedicineStockAdjust,
    MedicineUpdate,
    PrescriptionCreate,
    PrescriptionResponse,
    RefillRequestCreate,
    RefillRequestResponse,
    RefillStatusUpdate
)
from app.services import pharmacy_service

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy Module"])


@router.get("/medicines", response_model=List[MedicineResponse])
def list_medicines(
    search: Optional[str] = Query(None, description="Search by medication or generic name"),
    db: Session = Depends(get_db)
):
    return pharmacy_service.get_medicines(db=db, search=search)


@router.post("/medicines", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def add_medicine(
    payload: MedicineCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return pharmacy_service.create_medicine(db=db, data=payload, user=current_admin)


@router.put("/medicines/{medicine_id}/stock", response_model=MedicineResponse)
def adjust_stock(
    medicine_id: int,
    payload: MedicineStockAdjust,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return pharmacy_service.adjust_medicine_stock(
        db=db,
        medicine_id=medicine_id,
        quantity_change=payload.quantity_change,
        user=current_admin,
        reason=payload.reason
    )


@router.get("/low-stock", response_model=List[MedicineResponse])
def get_low_stock(
    current_user: User = Depends(require_clinical),
    db: Session = Depends(get_db)
):
    return pharmacy_service.get_low_stock_medicines(db=db)


@router.get("/prescriptions/my", response_model=List[PrescriptionResponse])
def get_my_prescriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Prescription).options(
        joinedload(Prescription.items),
        joinedload(Prescription.refill_requests),
        joinedload(Prescription.doctor).joinedload(Doctor.user),
        joinedload(Prescription.patient)
    )
    if current_user.role == UserRole.PATIENT:
        query = query.filter(Prescription.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if not doctor:
            return []
        query = query.filter(Prescription.doctor_id == doctor.id)
    return query.order_by(Prescription.created_at.desc()).all()


@router.get("/prescriptions", response_model=List[PrescriptionResponse])
def list_prescriptions(
    patient_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: patients must use the /pharmacy/prescriptions/my endpoint."
        )

    query = db.query(Prescription).options(
        joinedload(Prescription.items),
        joinedload(Prescription.refill_requests),
        joinedload(Prescription.doctor).joinedload(Doctor.user),
        joinedload(Prescription.patient)
    )

    if current_user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        if doctor:
            query = query.filter(Prescription.doctor_id == doctor.id)

    if patient_id:
        query = query.filter(Prescription.patient_id == patient_id)

    return query.order_by(Prescription.created_at.desc()).all()


@router.get("/prescriptions/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prescription = db.query(Prescription).options(
        joinedload(Prescription.items),
        joinedload(Prescription.refill_requests),
        joinedload(Prescription.doctor).joinedload(Doctor.user),
        joinedload(Prescription.patient)
    ).filter(Prescription.id == prescription_id).first()

    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found.")

    if current_user.role == UserRole.PATIENT and prescription.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view another patient's prescription."
        )

    return prescription


@router.post("/prescriptions", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def write_prescription(
    payload: PrescriptionCreate,
    request: Request,
    current_doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    return pharmacy_service.create_prescription(
        db=db,
        doctor_user=current_doctor,
        data=payload,
        ip_address=client_ip
    )


@router.post("/prescriptions/{prescription_id}/refill", response_model=RefillRequestResponse, status_code=status.HTTP_201_CREATED)
def request_refill(
    prescription_id: int,
    payload: RefillRequestCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    return pharmacy_service.request_prescription_refill(
        db=db,
        prescription_id=prescription_id,
        patient_user=current_user,
        data=payload,
        ip_address=client_ip
    )


@router.put("/refills/{refill_id}/status", response_model=RefillRequestResponse)
def update_refill_status(
    refill_id: int,
    payload: RefillStatusUpdate,
    current_user: User = Depends(require_clinical),
    db: Session = Depends(get_db)
):
    return pharmacy_service.update_refill_status(
        db=db,
        refill_id=refill_id,
        data=payload,
        user=current_user
    )
