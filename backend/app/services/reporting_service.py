import csv
import io
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.appointment import Appointment
from app.models.doctor import Doctor
from app.models.emergency import EmergencyRequest
from app.models.enums import AppointmentStatus, EmergencySeverity, LabOrderStatus, UserRole
from app.models.laboratory import LabOrder
from app.models.pharmacy import Medicine, Prescription, PrescriptionItem
from app.models.user import User
from app.schemas.pharmacy import MedicineResponse
from app.schemas.reporting import (
    DailyAppointmentCount,
    EmergencySeverityCount,
    HospitalReportResponse,
    LabTurnaroundSummary,
    PharmacyReportSummary,
    TopMedicineCount
)


def generate_report(db: Session, user: User, days: int = 30) -> HospitalReportResponse:
    cutoff_dt = datetime.now(timezone.utc) - timedelta(days=days)
    cutoff_date_str = cutoff_dt.strftime("%Y-%m-%d")

    doctor_profile = None
    if user.role == UserRole.DOCTOR:
        doctor_profile = db.query(Doctor).filter(Doctor.user_id == user.id).first()

    # 1. Appointments Aggregation
    appt_query = db.query(Appointment).filter(Appointment.appointment_date >= cutoff_date_str)
    if doctor_profile:
        appt_query = appt_query.filter(Appointment.doctor_id == doctor_profile.id)
    appointments = appt_query.all()

    # Group by date
    date_map = {}
    for a in appointments:
        d = a.appointment_date
        if d not in date_map:
            date_map[d] = {"count": 0, "scheduled": 0, "completed": 0, "cancelled": 0}
        date_map[d]["count"] += 1
        if a.status == AppointmentStatus.SCHEDULED:
            date_map[d]["scheduled"] += 1
        elif a.status == AppointmentStatus.COMPLETED:
            date_map[d]["completed"] += 1
        elif a.status == AppointmentStatus.CANCELLED:
            date_map[d]["cancelled"] += 1

    appointments_summary = [
        DailyAppointmentCount(
            date=d,
            count=vals["count"],
            scheduled=vals["scheduled"],
            completed=vals["completed"],
            cancelled=vals["cancelled"]
        )
        for d, vals in sorted(date_map.items())
    ]

    # 2. Emergency Cases Aggregation
    em_query = db.query(EmergencyRequest).filter(EmergencyRequest.created_at >= cutoff_dt)
    if doctor_profile:
        em_query = em_query.filter(
            (EmergencyRequest.assigned_doctor_id == doctor_profile.id) |
            (EmergencyRequest.assigned_doctor_id == None)
        )
    emergencies = em_query.all()

    sev_map = {sev.value: 0 for sev in EmergencySeverity}
    for e in emergencies:
        sev_map[e.severity.value] = sev_map.get(e.severity.value, 0) + 1

    emergency_summary = [
        EmergencySeverityCount(severity=sev, count=cnt)
        for sev, cnt in sev_map.items()
    ]

    # 3. Laboratory Turnaround & Status Metrics
    lab_query = db.query(LabOrder).filter(LabOrder.created_at >= cutoff_dt)
    if doctor_profile:
        lab_query = lab_query.filter(LabOrder.doctor_id == doctor_profile.id)
    lab_orders = lab_query.all()

    completed_orders = [o for o in lab_orders if o.status == LabOrderStatus.COMPLETED and o.completed_at]
    pending_orders = [o for o in lab_orders if o.status != LabOrderStatus.COMPLETED]
    abnormal_count = sum(1 for o in completed_orders if o.is_abnormal)
    normal_count = len(completed_orders) - abnormal_count

    durations = []
    for o in completed_orders:
        if o.completed_at and o.created_at:
            delta = (o.completed_at - o.created_at).total_seconds() / 3600.0
            durations.append(max(delta, 0.1))

    avg_turnaround = round(sum(durations) / len(durations), 1) if durations else 0.0

    laboratory_summary = LabTurnaroundSummary(
        avg_turnaround_hours=avg_turnaround,
        total_completed=len(completed_orders),
        total_pending=len(pending_orders),
        abnormal_count=abnormal_count,
        normal_count=normal_count
    )

    # 4. Pharmacy Metrics
    low_stock_query = db.query(Medicine).filter(
        Medicine.is_active == True,
        Medicine.stock_quantity <= Medicine.reorder_level
    )
    low_stock_meds = low_stock_query.all()

    # Top prescribed medicines
    top_items_query = db.query(
        Medicine.id,
        Medicine.name,
        Medicine.generic_name,
        func.count(PrescriptionItem.id).label("presc_count")
    ).join(PrescriptionItem, Medicine.id == PrescriptionItem.medicine_id
    ).group_by(Medicine.id, Medicine.name, Medicine.generic_name
    ).order_by(func.count(PrescriptionItem.id).desc()
    ).limit(5).all()

    top_prescribed = [
        TopMedicineCount(
            medicine_id=r[0],
            medicine_name=r[1],
            generic_name=r[2],
            prescription_count=r[3]
        )
        for r in top_items_query
    ]

    pharmacy_summary = PharmacyReportSummary(
        low_stock_count=len(low_stock_meds),
        low_stock_items=[MedicineResponse.model_validate(m) for m in low_stock_meds],
        top_prescribed=top_prescribed
    )

    return HospitalReportResponse(
        scope=user.role.value,
        days_evaluated=days,
        appointments_summary=appointments_summary,
        emergency_summary=emergency_summary,
        laboratory_summary=laboratory_summary,
        pharmacy_summary=pharmacy_summary
    )


def generate_csv_export(db: Session, user: User, report_type: str) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "appointments":
        writer.writerow(["ID", "Patient ID", "Doctor ID", "Date", "Slot", "Status", "Reason"])
        query = db.query(Appointment)
        if user.role == UserRole.DOCTOR:
            doc = db.query(Doctor).filter(Doctor.user_id == user.id).first()
            if doc:
                query = query.filter(Appointment.doctor_id == doc.id)
        for a in query.order_by(Appointment.appointment_date.desc()).all():
            writer.writerow([a.id, a.patient_id, a.doctor_id, a.appointment_date, a.time_slot, a.status.value, a.reason or ""])

    elif report_type == "emergency":
        writer.writerow(["ID", "Patient Name", "Phone", "Severity", "Status", "Doctor ID", "Created At", "Description"])
        query = db.query(EmergencyRequest).order_by(EmergencyRequest.created_at.desc())
        for e in query.all():
            writer.writerow([e.id, e.patient_name, e.patient_phone, e.severity.value, e.status.value, e.assigned_doctor_id or "", e.created_at.isoformat(), e.description])

    elif report_type == "laboratory":
        writer.writerow(["ID", "Patient ID", "Doctor ID", "Test ID", "Status", "Abnormal", "Result Text", "Created At", "Completed At"])
        query = db.query(LabOrder).order_by(LabOrder.created_at.desc())
        for o in query.all():
            writer.writerow([o.id, o.patient_id, o.doctor_id, o.test_id, o.status.value, o.is_abnormal, o.result_text or "", o.created_at.isoformat(), o.completed_at.isoformat() if o.completed_at else ""])

    elif report_type == "pharmacy":
        writer.writerow(["ID", "Name", "Generic Name", "Form", "Strength", "Stock", "Reorder Level", "Unit Price"])
        for m in db.query(Medicine).order_by(Medicine.name.asc()).all():
            writer.writerow([m.id, m.name, m.generic_name, m.dosage_form, m.strength, m.stock_quantity, m.reorder_level, m.unit_price])

    else:
        writer.writerow(["Error", "Invalid report type"])

    return output.getvalue()
