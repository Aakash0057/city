from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import PrescriptionStatus, RefillStatus
from app.schemas.doctor import DoctorResponse
from app.schemas.user import UserResponse


class MedicineBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    generic_name: str = Field(..., min_length=2, max_length=100)
    dosage_form: str = Field(..., min_length=2, max_length=50)
    strength: str = Field(..., min_length=1, max_length=50)
    stock_quantity: int = Field(0, ge=0)
    reorder_level: int = Field(20, ge=0)
    unit_price: int = Field(10, ge=0)
    is_active: bool = True


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)
    unit_price: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class MedicineStockAdjust(BaseModel):
    quantity_change: int = Field(..., description="Positive to add stock, negative to reduce")
    reason: Optional[str] = None


class MedicineResponse(MedicineBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PrescriptionItemCreate(BaseModel):
    medicine_id: int
    dosage: str = Field(..., min_length=1, max_length=100)
    frequency: str = Field(..., min_length=1, max_length=100)
    duration: str = Field(..., min_length=1, max_length=100)
    instructions: Optional[str] = None


class PrescriptionItemResponse(BaseModel):
    id: int
    prescription_id: int
    medicine_id: int
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str]
    medicine: Optional[MedicineResponse] = None

    model_config = ConfigDict(from_attributes=True)


class PrescriptionCreate(BaseModel):
    patient_id: int
    diagnosis: str = Field(..., min_length=2, max_length=255)
    notes: Optional[str] = None
    items: List[PrescriptionItemCreate] = Field(..., min_length=1)


class RefillRequestCreate(BaseModel):
    notes: Optional[str] = None


class RefillStatusUpdate(BaseModel):
    status: RefillStatus
    notes: Optional[str] = None


class RefillRequestResponse(BaseModel):
    id: int
    prescription_id: int
    patient_id: int
    status: RefillStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PrescriptionResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    diagnosis: str
    notes: Optional[str]
    status: PrescriptionStatus
    created_at: datetime
    patient: Optional[UserResponse] = None
    doctor: Optional[DoctorResponse] = None
    items: List[PrescriptionItemResponse] = []
    refill_requests: List[RefillRequestResponse] = []

    model_config = ConfigDict(from_attributes=True)
