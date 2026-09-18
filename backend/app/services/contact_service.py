from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.contact import ContactMessage
from app.models.enums import ContactStatus
from app.schemas.contact import ContactMessageCreate, ContactStatusUpdate
from app.services.activity_service import log_activity


def create_contact_message(
    db: Session,
    data: ContactMessageCreate,
    ip_address: Optional[str] = None
) -> ContactMessage:
    msg = ContactMessage(
        name=data.name,
        email=data.email,
        phone=data.phone,
        subject=data.subject,
        message=data.message,
        status=ContactStatus.NEW
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    log_activity(
        db=db,
        user_id=None,
        action="CONTACT_MESSAGE_SUBMITTED",
        entity_type="CONTACT_MESSAGE",
        entity_id=msg.id,
        details=f"Inquiry received from {msg.name} ({msg.email}): {msg.subject}",
        ip_address=ip_address
    )
    return msg


def get_contact_messages(
    db: Session,
    status_filter: Optional[ContactStatus] = None,
    skip: int = 0,
    limit: int = 50
) -> List[ContactMessage]:
    query = db.query(ContactMessage)
    if status_filter:
        query = query.filter(ContactMessage.status == status_filter)
    return query.order_by(ContactMessage.created_at.desc()).offset(skip).limit(limit).all()


def update_contact_status(
    db: Session,
    message_id: int,
    data: ContactStatusUpdate
) -> ContactMessage:
    msg = db.query(ContactMessage).filter(ContactMessage.id == message_id).first()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact message with ID {message_id} not found."
        )
    msg.status = data.status
    db.commit()
    db.refresh(msg)
    return msg
