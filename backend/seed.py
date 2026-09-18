import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.enums import (
    UserRole,
    AppointmentStatus,
    EmergencySeverity,
    EmergencyStatus,
    LabOrderStatus,
    PrescriptionStatus,
    RefillStatus,
    ContactStatus
)
from app.models.user import User
from app.models.doctor import Doctor
from app.models.service import Service
from app.models.appointment import Appointment
from app.models.emergency import EmergencyRequest
from app.models.laboratory import LabTest, LabOrder
from app.models.pharmacy import Medicine, Prescription, PrescriptionItem, RefillRequest
from app.models.contact import ContactMessage
from app.models.activity_log import ActivityLog

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")


def seed_database(db: Session, force: bool = False):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    existing_users = db.query(User).count()
    if existing_users > 0 and not force:
        logger.info(f"Database already contains {existing_users} users. Skipping seeding.")
        return

    logger.info("Seeding database with initial data...")

    default_password_hash = get_password_hash("Password123!")

    # 1. Users & Profiles
    admin_user = User(
        email="admin@citycare.com",
        hashed_password=default_password_hash,
        full_name="Hospital Administrator",
        role=UserRole.ADMIN,
        phone="+1 (555) 019-2831",
        is_active=True
    )
    db.add(admin_user)

    # Doctors
    doc1_user = User(
        email="doctor@citycare.com",
        hashed_password=default_password_hash,
        full_name="Dr. Sarah Jenkins",
        role=UserRole.DOCTOR,
        phone="+1 (555) 014-9281",
        is_active=True
    )
    doc2_user = User(
        email="doctor.marcus@citycare.com",
        hashed_password=default_password_hash,
        full_name="Dr. Marcus Chen",
        role=UserRole.DOCTOR,
        phone="+1 (555) 014-9282",
        is_active=True
    )
    doc3_user = User(
        email="doctor.priya@citycare.com",
        hashed_password=default_password_hash,
        full_name="Dr. Priya Patel",
        role=UserRole.DOCTOR,
        phone="+1 (555) 014-9283",
        is_active=True
    )
    doc4_user = User(
        email="doctor.james@citycare.com",
        hashed_password=default_password_hash,
        full_name="Dr. James Wilson",
        role=UserRole.DOCTOR,
        phone="+1 (555) 014-9284",
        is_active=True
    )
    db.add_all([doc1_user, doc2_user, doc3_user, doc4_user])

    # Patients
    patient1_user = User(
        email="patient@citycare.com",
        hashed_password=default_password_hash,
        full_name="John Doe",
        role=UserRole.PATIENT,
        phone="+1 (555) 017-8821",
        is_active=True
    )
    patient2_user = User(
        email="jane.smith@citycare.com",
        hashed_password=default_password_hash,
        full_name="Jane Smith",
        role=UserRole.PATIENT,
        phone="+1 (555) 017-4490",
        is_active=True
    )
    db.add_all([patient1_user, patient2_user])
    db.flush()

    # Doctor clinical details
    doc1 = Doctor(
        user_id=doc1_user.id,
        specialty="Cardiology",
        bio="Board-certified cardiologist with over 15 years specializing in preventive cardiovascular healthcare and cardiac imaging.",
        room_number="Suite 302",
        qualifications="MD, FACC - Harvard Medical School",
        available_days="Monday,Tuesday,Wednesday,Thursday,Friday",
        consultation_fee=120,
        photo_url="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400"
    )
    doc2 = Doctor(
        user_id=doc2_user.id,
        specialty="Neurology",
        bio="Clinical neurologist focusing on headache disorders, neuro-rehabilitation, and neurovascular assessment.",
        room_number="Suite 415",
        qualifications="MD, PhD - Johns Hopkins University",
        available_days="Monday,Wednesday,Friday",
        consultation_fee=140,
        photo_url="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400"
    )
    doc3 = Doctor(
        user_id=doc3_user.id,
        specialty="Pediatrics",
        bio="Compassionate pediatrician dedicated to infant development, pediatric wellness checks, and preventative care.",
        room_number="Suite 108",
        qualifications="MD, FAAP - Stanford University School of Medicine",
        available_days="Tuesday,Wednesday,Thursday,Friday",
        consultation_fee=95,
        photo_url="https://images.unsplash.com/photo-1594824813576-905ff3411a76?auto=format&fit=crop&q=80&w=400"
    )
    doc4 = Doctor(
        user_id=doc4_user.id,
        specialty="Orthopedics",
        bio="Orthopedic surgeon with extensive clinical focus on joint preservation, sports injuries, and robotic arthroplasty.",
        room_number="Suite 220",
        qualifications="MD, FAAOS - Columbia University",
        available_days="Monday,Tuesday,Thursday",
        consultation_fee=130,
        photo_url="https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400"
    )
    db.add_all([doc1, doc2, doc3, doc4])
    db.flush()

    # 2. Services (5 Core Configuration Items)
    services = [
        Service(
            name="Emergency Module",
            code="EMERGENCY",
            department="Emergency Care",
            description="24/7 high-priority trauma, acute triage, and rapid stabilization services.",
            icon_name="Ambulance",
            is_active=True
        ),
        Service(
            name="Doctor Dashboard",
            code="DOCTOR_DASHBOARD",
            department="Clinical Operations",
            description="Centralized clinical workbench synchronizing schedule, emergency queue, and patient orders.",
            icon_name="Stethoscope",
            is_active=True
        ),
        Service(
            name="Laboratory",
            code="LABORATORY",
            department="Diagnostic Pathology",
            description="Automated clinical chemistry, hematology, and microbiological diagnostic testing.",
            icon_name="TestTube",
            is_active=True
        ),
        Service(
            name="Pharmacy",
            code="PHARMACY",
            department="Pharmaceutical Care",
            description="Full-service computerized medication dispensing, prescription management, and inventory tracking.",
            icon_name="Pill",
            is_active=True
        ),
        Service(
            name="Reporting",
            code="REPORTING",
            department="Health Analytics",
            description="Real-time clinical throughput analytics, emergency load statistics, and medication audits.",
            icon_name="BarChart3",
            is_active=True
        )
    ]
    db.add_all(services)

    # 3. Lab Tests Catalog
    lab_tests = [
        LabTest(code="CBC", name="Complete Blood Count", category="Hematology", description="Evaluates overall health and detects an array of disorders including anemia and infection.", normal_range="4.5-11.0 x10^3/uL", unit="x10^3/uL", price=30),
        LabTest(code="LIPID", name="Lipid Panel", category="Biochemistry", description="Measures cholesterol levels to evaluate cardiovascular risk profiles.", normal_range="< 200 mg/dL", unit="mg/dL", price=45),
        LabTest(code="GLUCOSE", name="Fasting Blood Glucose", category="Endocrinology", description="Screens for diabetes and metabolic dysregulation.", normal_range="70-99 mg/dL", unit="mg/dL", price=25),
        LabTest(code="HBA1C", name="Hemoglobin A1c", category="Endocrinology", description="Provides average blood sugar control estimate over 3 months.", normal_range="< 5.7 %", unit="%", price=40),
        LabTest(code="BMP", name="Basic Metabolic Panel", category="Biochemistry", description="Assesses kidney function, blood sugar, and acid-base / electrolyte balance.", normal_range="Normal range", unit="", price=50),
        LabTest(code="TSH", name="Thyroid Stimulating Hormone", category="Endocrinology", description="Evaluates thyroid gland activity and metabolic regulation.", normal_range="0.4-4.0 mIU/L", unit="mIU/L", price=35),
    ]
    db.add_all(lab_tests)
    db.flush()

    # 4. Medicines Catalog (with at least one low-stock item)
    medicines = [
        Medicine(name="Amoxicillin", generic_name="Amoxicillin", dosage_form="Capsule", strength="500mg", stock_quantity=150, reorder_level=30, unit_price=12),
        Medicine(name="Atorvastatin", generic_name="Atorvastatin Calcium", dosage_form="Tablet", strength="20mg", stock_quantity=80, reorder_level=25, unit_price=18),
        Medicine(name="Metformin", generic_name="Metformin HCl", dosage_form="Tablet", strength="850mg", stock_quantity=120, reorder_level=30, unit_price=10),
        # Low-stock item:
        Medicine(name="Lisinopril", generic_name="Lisinopril", dosage_form="Tablet", strength="10mg", stock_quantity=8, reorder_level=25, unit_price=15),
        Medicine(name="Albuterol Inhaler", generic_name="Albuterol Sulfate", dosage_form="Inhaler", strength="90mcg", stock_quantity=45, reorder_level=15, unit_price=35),
        Medicine(name="Omeprazole", generic_name="Omeprazole", dosage_form="Capsule", strength="40mg", stock_quantity=95, reorder_level=20, unit_price=14),
    ]
    db.add_all(medicines)
    db.flush()

    # 5. Appointments
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tomorrow_str = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    yesterday_str = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

    appointments = [
        # Today's scheduled appointment for Dr. Sarah Jenkins (doc1)
        Appointment(
            patient_id=patient1_user.id,
            doctor_id=doc1.id,
            appointment_date=today_str,
            time_slot="10:00",
            status=AppointmentStatus.SCHEDULED,
            reason="Routine cardiovascular annual follow-up",
            notes="Patient reports occasional palpitations after exercise."
        ),
        # Today's scheduled appointment for Dr. Marcus Chen (doc2)
        Appointment(
            patient_id=patient2_user.id,
            doctor_id=doc2.id,
            appointment_date=today_str,
            time_slot="11:30",
            status=AppointmentStatus.SCHEDULED,
            reason="Persistent tension headache evaluation",
            notes="Requested MRI review if headaches persist."
        ),
        # Future appointment
        Appointment(
            patient_id=patient1_user.id,
            doctor_id=doc3.id,
            appointment_date=tomorrow_str,
            time_slot="14:00",
            status=AppointmentStatus.SCHEDULED,
            reason="Pediatric consultation for dependent",
            notes="Immunization update scheduled."
        ),
        # Past completed appointment
        Appointment(
            patient_id=patient1_user.id,
            doctor_id=doc1.id,
            appointment_date=yesterday_str,
            time_slot="09:00",
            status=AppointmentStatus.COMPLETED,
            reason="Initial cardiac stress test review",
            notes="Stress test normal. Advised lifestyle modifications."
        ),
        # Past cancelled appointment
        Appointment(
            patient_id=patient2_user.id,
            doctor_id=doc4.id,
            appointment_date=yesterday_str,
            time_slot="15:30",
            status=AppointmentStatus.CANCELLED,
            reason="Knee swelling consultation",
            notes="Cancelled by patient due to schedule conflict."
        )
    ]
    db.add_all(appointments)
    db.flush()

    # 6. Emergency Requests
    emergencies = [
        EmergencyRequest(
            patient_name="Robert Taylor",
            patient_phone="+1 (555) 993-2101",
            severity=EmergencySeverity.CRITICAL,
            description="Severe sudden chest pain radiating to left arm, shortness of breath, diaphoresis.",
            status=EmergencyStatus.WAITING,
            assigned_doctor_id=doc1.id,
            triage_notes="ECG ordered STAT. Crash cart positioned."
        ),
        EmergencyRequest(
            patient_name="Elena Rostova",
            patient_phone="+1 (555) 882-9012",
            severity=EmergencySeverity.HIGH,
            description="Deep laceration on right forearm with active bleeding following machinery accident.",
            status=EmergencyStatus.IN_TREATMENT,
            assigned_doctor_id=doc4.id,
            triage_notes="Direct pressure applied; preparing suture tray and tetanus prophylaxis."
        ),
        EmergencyRequest(
            patient_name="Carlos Mendez",
            patient_phone="+1 (555) 773-4411",
            severity=EmergencySeverity.MEDIUM,
            description="High fever (103°F) for 48 hours accompanied by persistent productive cough.",
            status=EmergencyStatus.WAITING,
            triage_notes="Vitals stable; placed in airborne isolation pending chest X-ray."
        ),
        EmergencyRequest(
            patient_name="Samantha Brown",
            patient_phone="+1 (555) 321-7788",
            severity=EmergencySeverity.LOW,
            description="Twisted right ankle during soccer training. Moderate edema, can bear partial weight.",
            status=EmergencyStatus.RESOLVED,
            assigned_doctor_id=doc4.id,
            triage_notes="X-ray negative for fracture. Ankle splint applied, RICE protocol advised."
        )
    ]
    db.add_all(emergencies)

    # 7. Lab Orders
    now = datetime.now(timezone.utc)
    lab_orders = [
        # Completed order with abnormal flag for Patient 1
        LabOrder(
            patient_id=patient1_user.id,
            doctor_id=doc1.id,
            test_id=lab_tests[1].id,  # Lipid Panel
            status=LabOrderStatus.COMPLETED,
            notes="Evaluate total cholesterol after 3 months of dietary intervention.",
            result_text="Total Cholesterol: 242 mg/dL (Elevated), LDL: 165 mg/dL, HDL: 42 mg/dL, Triglycerides: 175 mg/dL.",
            result_value="242 mg/dL",
            is_abnormal=True,
            sample_collected_at=now - timedelta(days=2),
            completed_at=now - timedelta(days=1)
        ),
        # Completed normal order for Patient 1
        LabOrder(
            patient_id=patient1_user.id,
            doctor_id=doc1.id,
            test_id=lab_tests[0].id,  # CBC
            status=LabOrderStatus.COMPLETED,
            notes="Baseline complete blood count.",
            result_text="WBC: 6.8 x10^3/uL, RBC: 4.8 x10^6/uL, Hemoglobin: 15.1 g/dL, Platelets: 240 x10^3/uL. All markers within normal reference intervals.",
            result_value="6.8 x10^3/uL",
            is_abnormal=False,
            sample_collected_at=now - timedelta(days=3),
            completed_at=now - timedelta(days=2)
        ),
        # Sample collected, pending results for Patient 2
        LabOrder(
            patient_id=patient2_user.id,
            doctor_id=doc2.id,
            test_id=lab_tests[2].id,  # Fasting Glucose
            status=LabOrderStatus.SAMPLE_COLLECTED,
            notes="Screening for recurrent fatigue.",
            sample_collected_at=now - timedelta(hours=4)
        ),
        # Newly ordered test
        LabOrder(
            patient_id=patient1_user.id,
            doctor_id=doc1.id,
            test_id=lab_tests[3].id,  # HbA1c
            status=LabOrderStatus.ORDERED,
            notes="Order HbA1c to correlate with metabolic profile."
        )
    ]
    db.add_all(lab_orders)
    db.flush()

    # 8. Prescriptions & Items
    presc1 = Prescription(
        patient_id=patient1_user.id,
        doctor_id=doc1.id,
        diagnosis="Hyperlipidemia & Stage 1 Essential Hypertension",
        notes="Monitor BP daily in morning and evening. Follow-up lipid panel in 12 weeks.",
        status=PrescriptionStatus.ACTIVE
    )
    db.add(presc1)
    db.flush()

    item1 = PrescriptionItem(
        prescription_id=presc1.id,
        medicine_id=medicines[1].id,  # Atorvastatin
        dosage="20mg",
        frequency="Once daily at bedtime",
        duration="90 days",
        instructions="Take with water at night. Report any unexplained muscle weakness or tenderness."
    )
    item2 = PrescriptionItem(
        prescription_id=presc1.id,
        medicine_id=medicines[3].id,  # Lisinopril
        dosage="10mg",
        frequency="Once daily in the morning",
        duration="90 days",
        instructions="Take with or without food. Avoid potassium-rich salt substitutes."
    )
    db.add_all([item1, item2])
    db.flush()

    # Refill Request for Patient 1
    refill = RefillRequest(
        prescription_id=presc1.id,
        patient_id=patient1_user.id,
        status=RefillStatus.REQUESTED,
        notes="Patient requested 30-day refill ahead of travel."
    )
    db.add(refill)

    # 9. Contact Messages
    contact_msgs = [
        ContactMessage(
            name="Arthur Dent",
            email="arthur@galaxy.org",
            phone="+1 (555) 234-8901",
            subject="Inquiry regarding cardiology imaging appointments",
            message="Hello, I would like to inquire if echocardiograms require a specialist referral from an outside physician before booking?",
            status=ContactStatus.NEW
        ),
        ContactMessage(
            name="Grace Hopper",
            email="grace@navy.gov",
            phone="+1 (555) 789-0123",
            subject="Volunteer program and patient assistance",
            message="Does CityCare Hospital offer clinical observer programs for senior medical students during the summer terms?",
            status=ContactStatus.READ
        )
    ]
    db.add_all(contact_msgs)

    # 10. Initial Activity Logs
    logs = [
        ActivityLog(
            user_id=admin_user.id,
            action="SYSTEM_INIT",
            entity_type="SYSTEM",
            entity_id=1,
            details="CityCare Hospital database initialized with standard baseline configuration.",
            ip_address="127.0.0.1"
        ),
        ActivityLog(
            user_id=doc1_user.id,
            action="PRESCRIBE_MEDICATION",
            entity_type="PRESCRIPTION",
            entity_id=presc1.id,
            details=f"Dr. Sarah Jenkins issued prescription #{presc1.id} for patient John Doe.",
            ip_address="127.0.0.1"
        )
    ]
    db.add_all(logs)

    db.commit()
    logger.info("Database seeding successfully completed!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db, force=True)
    finally:
        db.close()
