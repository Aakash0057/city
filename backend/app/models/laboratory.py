from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import LabOrderStatus


class LabTest(Base):
    __tablename__ = "lab_tests"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    normal_range = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True)
    price = Column(Integer, default=25)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    orders = relationship("LabOrder", back_populates="test", cascade="all, delete-orphan")


class LabOrder(Base):
    __tablename__ = "lab_orders"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    test_id = Column(Integer, ForeignKey("lab_tests.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(LabOrderStatus), default=LabOrderStatus.ORDERED, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    result_text = Column(Text, nullable=True)
    result_value = Column(String(100), nullable=True)
    is_abnormal = Column(Boolean, default=False, nullable=False)
    sample_collected_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    patient = relationship("User", back_populates="lab_orders", foreign_keys=[patient_id])
    doctor = relationship("Doctor", back_populates="lab_orders", foreign_keys=[doctor_id])
    test = relationship("LabTest", back_populates="orders")
