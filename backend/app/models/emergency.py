from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import EmergencySeverity, EmergencyStatus


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(255), nullable=False)
    patient_phone = Column(String(50), nullable=False)
    severity = Column(SQLEnum(EmergencySeverity), default=EmergencySeverity.MEDIUM, nullable=False, index=True)
    description = Column(Text, nullable=False)
    status = Column(SQLEnum(EmergencyStatus), default=EmergencyStatus.WAITING, nullable=False, index=True)
    assigned_doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True, index=True)
    triage_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    assigned_doctor = relationship("Doctor", back_populates="assigned_emergencies")

    __table_args__ = (
        Index("ix_emergency_severity_status_created", "severity", "status", "created_at"),
    )
