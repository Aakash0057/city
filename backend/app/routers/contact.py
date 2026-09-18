from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import require_admin
from app.models.enums import ContactStatus
from app.models.user import User
from app.schemas.contact import ContactMessageCreate, ContactMessageResponse, ContactStatusUpdate
from app.services import contact_service

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post("", response_model=ContactMessageResponse, status_code=status.HTTP_201_CREATED)
def submit_contact_message(
    payload: ContactMessageCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    return contact_service.create_contact_message(db=db, data=payload, ip_address=client_ip)


@router.get("", response_model=List[ContactMessageResponse])
def get_contact_messages(
    status_filter: Optional[ContactStatus] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return contact_service.get_contact_messages(db=db, status_filter=status_filter, skip=skip, limit=limit)


@router.put("/{message_id}/status", response_model=ContactMessageResponse)
def update_message_status(
    message_id: int,
    payload: ContactStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return contact_service.update_contact_status(db=db, message_id=message_id, data=payload)
