from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import require_clinical, get_current_user
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.emergency import EmergencyRequestCreate, EmergencyResponse, EmergencyTriageUpdate
from app.services import emergency_service

router = APIRouter(prefix="/emergency", tags=["Emergency Module"])


@router.post("", response_model=EmergencyResponse, status_code=status.HTTP_201_CREATED)
def submit_emergency_request(
    payload: EmergencyRequestCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    return emergency_service.create_emergency_request(db=db, data=payload, ip_address=client_ip)


@router.get("/queue", response_model=List[EmergencyResponse])
def get_emergency_queue(
    include_resolved: bool = False,
    current_user: User = Depends(require_clinical),
    db: Session = Depends(get_db)
):
    return emergency_service.get_emergency_queue(db=db, include_resolved=include_resolved)


@router.put("/{request_id}/triage", response_model=EmergencyResponse)
def triage_emergency(
    request_id: int,
    payload: EmergencyTriageUpdate,
    request: Request,
    current_user: User = Depends(require_clinical),
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    return emergency_service.triage_emergency_request(
        db=db,
        request_id=request_id,
        data=payload,
        user=current_user,
        ip_address=client_ip
    )
