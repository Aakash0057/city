from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    specialty = Column(String(100), nullable=False, index=True)
    bio = Column(Text, nullable=True)
    room_number = Column(String(50), nullable=True)
    qualifications = Column(String(255), nullable=True)
    available_days = Column(String(100), default="Monday,Tuesday,Wednesday,Thursday,Friday")
    consultation_fee = Column(Integer, default=50)
    photo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    appointments = relationship("Appointment", back_populates="doctor", foreign_keys="Appointment.doctor_id")
    lab_orders = relationship("LabOrder", back_populates="doctor", foreign_keys="LabOrder.doctor_id")
    prescriptions = relationship("Prescription", back_populates="doctor", foreign_keys="Prescription.doctor_id")
    assigned_emergencies = relationship("EmergencyRequest", back_populates="assigned_doctor")
