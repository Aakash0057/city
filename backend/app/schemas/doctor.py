from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserResponse


class DoctorBase(BaseModel):
    specialty: str = Field(..., min_length=2, max_length=100)
    bio: Optional[str] = None
    room_number: Optional[str] = None
    qualifications: Optional[str] = None
    available_days: str = "Monday,Tuesday,Wednesday,Thursday,Friday"
    consultation_fee: int = Field(50, ge=0)
    photo_url: Optional[str] = None


class DoctorCreate(DoctorBase):
    user_id: int


class DoctorUpdate(BaseModel):
    specialty: Optional[str] = None
    bio: Optional[str] = None
    room_number: Optional[str] = None
    qualifications: Optional[str] = None
    available_days: Optional[str] = None
    consultation_fee: Optional[int] = None
    photo_url: Optional[str] = None


class DoctorResponse(DoctorBase):
    id: int
    user_id: int
    created_at: datetime
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)
