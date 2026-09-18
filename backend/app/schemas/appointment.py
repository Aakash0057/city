from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, computed_field
from app.models.enums import AppointmentStatus
from app.schemas.doctor import DoctorResponse
from app.schemas.user import UserResponse


class TimeSlotAvailability(BaseModel):
    time_slot: str
    is_available: bool


class DoctorSlotsResponse(BaseModel):
    doctor_id: int
    date: str
    available_slots: List[TimeSlotAvailability]

    @computed_field
    @property
    def slots(self) -> List[TimeSlotAvailability]:
        return self.available_slots


class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    time_slot: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    reason: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)


class AppointmentReschedule(BaseModel):
    appointment_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    time_slot: str = Field(..., pattern=r"^\d{2}:\d{2}$")


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: str
    time_slot: str
    status: AppointmentStatus
    reason: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    patient: Optional[UserResponse] = None
    doctor: Optional[DoctorResponse] = None

    model_config = ConfigDict(from_attributes=True)
