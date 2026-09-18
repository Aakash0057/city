from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.enums import ContactStatus


class ContactMessageCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    subject: str = Field(..., min_length=3, max_length=255)
    message: str = Field(..., min_length=10, max_length=2000)


class ContactStatusUpdate(BaseModel):
    status: ContactStatus


class ContactMessageResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    subject: str
    message: str
    status: ContactStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
