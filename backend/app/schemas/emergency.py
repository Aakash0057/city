from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import EmergencySeverity, EmergencyStatus
from app.schemas.doctor import DoctorResponse


class EmergencyRequestCreate(BaseModel):
    patient_name: str = Field(..., min_length=2, max_length=255)
    patient_phone: str = Field(..., min_length=5, max_length=50)
    severity: EmergencySeverity = EmergencySeverity.MEDIUM
    description: str = Field(..., min_length=5, max_length=2000)


class EmergencyTriageUpdate(BaseModel):
    status: EmergencyStatus
    severity: Optional[EmergencySeverity] = None
    assigned_doctor_id: Optional[int] = None
    triage_notes: Optional[str] = None


class EmergencyResponse(BaseModel):
    id: int
    patient_name: str
    patient_phone: str
    severity: EmergencySeverity
    description: str
    status: EmergencyStatus
    assigned_doctor_id: Optional[int]
    triage_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    assigned_doctor: Optional[DoctorResponse] = None

    model_config = ConfigDict(from_attributes=True)
