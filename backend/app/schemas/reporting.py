from typing import Dict, List, Optional
from pydantic import BaseModel
from app.schemas.pharmacy import MedicineResponse


class DailyAppointmentCount(BaseModel):
    date: str
    count: int
    scheduled: int
    completed: int
    cancelled: int


class EmergencySeverityCount(BaseModel):
    severity: str
    count: int


class LabTurnaroundSummary(BaseModel):
    avg_turnaround_hours: float
    total_completed: int
    total_pending: int
    abnormal_count: int
    normal_count: int


class TopMedicineCount(BaseModel):
    medicine_id: int
    medicine_name: str
    generic_name: str
    prescription_count: int


class PharmacyReportSummary(BaseModel):
    low_stock_count: int
    low_stock_items: List[MedicineResponse]
    top_prescribed: List[TopMedicineCount]


class HospitalReportResponse(BaseModel):
    scope: str  # "ADMIN" or "DOCTOR"
    days_evaluated: int
    appointments_summary: List[DailyAppointmentCount]
    emergency_summary: List[EmergencySeverityCount]
    laboratory_summary: LabTurnaroundSummary
    pharmacy_summary: PharmacyReportSummary
