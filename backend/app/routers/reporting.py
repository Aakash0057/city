from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import require_clinical
from app.models.user import User
from app.schemas.reporting import HospitalReportResponse
from app.services import reporting_service

router = APIRouter(prefix="/reporting", tags=["Reporting Module"])


@router.get("", response_model=HospitalReportResponse)
def get_hospital_reports(
    days: int = Query(30, ge=1, le=365, description="Historical window in days"),
    current_user: User = Depends(require_clinical),
    db: Session = Depends(get_db)
):
    return reporting_service.generate_report(db=db, user=current_user, days=days)


@router.get("/export-csv")
def export_report_csv(
    report_type: str = Query("appointments", pattern="^(appointments|emergency|laboratory|pharmacy)$"),
    current_user: User = Depends(require_clinical),
    db: Session = Depends(get_db)
):
    csv_data = reporting_service.generate_csv_export(db=db, user=current_user, report_type=report_type)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=citycare_{report_type}_report.csv"
        }
    )
