from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, computed_field
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

    @computed_field
    @property
    def full_name(self) -> str:
        return self.user.full_name if self.user else ""

    @computed_field
    @property
    def email(self) -> str:
        return self.user.email if self.user else ""

    model_config = ConfigDict(from_attributes=True)
