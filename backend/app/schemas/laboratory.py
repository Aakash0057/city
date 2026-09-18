from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import LabOrderStatus
from app.schemas.doctor import DoctorResponse
from app.schemas.user import UserResponse


class LabTestBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    category: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    normal_range: Optional[str] = None
    unit: Optional[str] = None
    price: int = Field(25, ge=0)
    is_active: bool = True


class LabTestCreate(LabTestBase):
    pass


class LabTestResponse(LabTestBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LabOrderCreate(BaseModel):
    patient_id: int
    test_id: int
    notes: Optional[str] = None


class LabOrderSampleCollect(BaseModel):
    notes: Optional[str] = None


class LabOrderResultEntry(BaseModel):
    result_text: str = Field(..., min_length=2)
    result_value: Optional[str] = None
    is_abnormal: bool = False


class LabOrderResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    test_id: int
    status: LabOrderStatus
    notes: Optional[str]
    result_text: Optional[str]
    result_value: Optional[str]
    is_abnormal: bool
    sample_collected_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    patient: Optional[UserResponse] = None
    doctor: Optional[DoctorResponse] = None
    test: Optional[LabTestResponse] = None

    model_config = ConfigDict(from_attributes=True)
