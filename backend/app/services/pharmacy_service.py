from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models.doctor import Doctor
from app.models.enums import PrescriptionStatus, RefillStatus, UserRole
from app.models.pharmacy import Medicine, Prescription, PrescriptionItem, RefillRequest
from app.models.user import User
from app.schemas.pharmacy import (
    MedicineCreate,
    MedicineUpdate,
    PrescriptionCreate,
    RefillRequestCreate,
    RefillStatusUpdate
)
from app.services.activity_service import log_activity


def get_medicines(db: Session, search: Optional[str] = None) -> List[Medicine]:
    query = db.query(Medicine).filter(Medicine.is_active == True)
    if search:
        query = query.filter(
            (Medicine.name.ilike(f"%{search}%")) |
            (Medicine.generic_name.ilike(f"%{search}%"))
        )
    return query.order_by(Medicine.name.asc()).all()


def get_low_stock_medicines(db: Session) -> List[Medicine]:
    return db.query(Medicine).filter(
        Medicine.is_active == True,
        Medicine.stock_quantity <= Medicine.reorder_level
    ).order_by(Medicine.stock_quantity.asc()).all()


def create_medicine(db: Session, data: MedicineCreate, user: User) -> Medicine:
    medicine = Medicine(
        name=data.name,
        generic_name=data.generic_name,
        dosage_form=data.dosage_form,
        strength=data.strength,
        stock_quantity=data.stock_quantity,
        reorder_level=data.reorder_level,
        unit_price=data.unit_price,
        is_active=data.is_active
    )
    db.add(medicine)
    db.commit()
    db.refresh(medicine)

    log_activity(
        db=db,
        user_id=user.id,
        action="CREATE_MEDICINE",
        entity_type="MEDICINE",
        entity_id=medicine.id,
        details=f"Medicine {medicine.name} added to pharmacy catalog by {user.email}"
    )
    return medicine


def adjust_medicine_stock(
    db: Session,
    medicine_id: int,
    quantity_change: int,
    user: User,
    reason: Optional[str] = None
) -> Medicine:
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicine not found.")

    new_stock = med.stock_quantity + quantity_change
    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Current inventory is {med.stock_quantity} units."
        )

    med.stock_quantity = new_stock
    db.commit()
    db.refresh(med)

    log_activity(
        db=db,
        user_id=user.id,
        action="UPDATE_MEDICINE_STOCK",
        entity_type="MEDICINE",
        entity_id=med.id,
        details=f"Stock adjusted by {quantity_change} (New total: {med.stock_quantity}). Reason: {reason or 'Inventory adjustment'}"
    )
    return med


def create_prescription(
    db: Session,
    doctor_user: User,
    data: PrescriptionCreate,
    ip_address: Optional[str] = None
) -> Prescription:
    doctor = db.query(Doctor).filter(Doctor.user_id == doctor_user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found for authenticated user."
        )

    patient = db.query(User).filter(User.id == data.patient_id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {data.patient_id} not found."
        )

    # Validate items and deduct stock if available
    for item in data.items:
        med = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
        if not med:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Medicine ID {item.medicine_id} not found in catalog."
            )
        if med.stock_quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Medicine '{med.name}' is currently out of stock."
            )
        # Deduct 1 unit pack
        med.stock_quantity -= 1

    prescription = Prescription(
        patient_id=data.patient_id,
        doctor_id=doctor.id,
        diagnosis=data.diagnosis,
        notes=data.notes,
        status=PrescriptionStatus.ACTIVE
    )
    db.add(prescription)
    db.flush()

    for item in data.items:
        presc_item = PrescriptionItem(
            prescription_id=prescription.id,
            medicine_id=item.medicine_id,
            dosage=item.dosage,
            frequency=item.frequency,
            duration=item.duration,
            instructions=item.instructions
        )
        db.add(presc_item)

    db.commit()
    db.refresh(prescription)

    log_activity(
        db=db,
        user_id=doctor_user.id,
        action="CREATE_PRESCRIPTION",
        entity_type="PRESCRIPTION",
        entity_id=prescription.id,
        details=f"Prescription #{prescription.id} written for patient #{data.patient_id} with {len(data.items)} items.",
        ip_address=ip_address
    )
    return prescription


def request_prescription_refill(
    db: Session,
    prescription_id: int,
    patient_user: User,
    data: RefillRequestCreate,
    ip_address: Optional[str] = None
) -> RefillRequest:
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found.")

    if prescription.patient_id != patient_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you cannot request refills for another patient's prescription."
        )

    refill = RefillRequest(
        prescription_id=prescription.id,
        patient_id=patient_user.id,
        status=RefillStatus.REQUESTED,
        notes=data.notes
    )
    db.add(refill)
    db.commit()
    db.refresh(refill)

    log_activity(
        db=db,
        user_id=patient_user.id,
        action="REQUEST_PRESCRIPTION_REFILL",
        entity_type="REFILL_REQUEST",
        entity_id=refill.id,
        details=f"Patient {patient_user.email} requested refill for Prescription #{prescription.id}",
        ip_address=ip_address
    )
    return refill


def update_refill_status(
    db: Session,
    refill_id: int,
    data: RefillStatusUpdate,
    user: User
) -> RefillRequest:
    refill = db.query(RefillRequest).filter(RefillRequest.id == refill_id).first()
    if not refill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Refill request not found.")

    refill.status = data.status
    if data.notes:
        refill.notes = data.notes
    db.commit()
    db.refresh(refill)

    log_activity(
        db=db,
        user_id=user.id,
        action="UPDATE_REFILL_STATUS",
        entity_type="REFILL_REQUEST",
        entity_id=refill.id,
        details=f"Refill #{refill.id} updated to {data.status.value} by {user.email}"
    )
    return refill
