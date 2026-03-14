from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, func
from ..database import get_session
from ..models import Lead, Disbursement, Ambassador, SystemSettings
from .auth import require_admin_token
from uuid import UUID
from datetime import datetime, timezone
from typing import List
import io
import csv

router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(require_admin_token)])

@router.get("/settings")
def get_settings(session: Session = Depends(get_session)):
    settings = session.get(SystemSettings, 1)
    if not settings:
        settings = SystemSettings(id=1, company_revenue_rate=0.7, ambassador_commission_rate=0.3)
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return settings

from pydantic import BaseModel
class SettingsUpdate(BaseModel):
    company_revenue_rate: float
    ambassador_commission_rate: float

@router.patch("/settings")
def update_settings(settings_in: SettingsUpdate, session: Session = Depends(get_session)):
    settings = session.get(SystemSettings, 1)
    if not settings:
        settings = SystemSettings(id=1)
    settings.company_revenue_rate = settings_in.company_revenue_rate
    settings.ambassador_commission_rate = settings_in.ambassador_commission_rate
    settings.updated_at = datetime.now(timezone.utc)
    session.add(settings)
    session.commit()
    session.refresh(settings)
    return settings

@router.get("/export/all")
def export_all_data(session: Session = Depends(get_session)):
    output = io.StringIO()
    writer = csv.writer(output)
    
    # LEADS SHEET (section)
    writer.writerow(["--- LEADS ---"])
    writer.writerow(["ID", "Student Name", "Course", "Loan Amount", "Status", "Date"])
    leads = session.exec(select(Lead)).all()
    for l in leads:
        writer.writerow([l.id, l.student_name, l.course_and_university, l.loan_requirement, l.status, l.created_at])
    
    writer.writerow([])
    
    # AMBASSADORS SHEET (section)
    writer.writerow(["--- AMBASSADORS ---"])
    writer.writerow(["ID", "Name", "Email", "College", "Referral Code", "Date Joined"])
    ambassadors = session.exec(select(Ambassador)).all()
    for a in ambassadors:
        writer.writerow([a.id, a.full_name, a.email, a.college_name, a.referral_code, a.created_at])
        
    writer.writerow([])
    
    # PAYOUTS SHEET (section)
    writer.writerow(["--- PAYOUTS ---"])
    writer.writerow(["ID", "Lead ID", "Amount Disbursed", "Commission Earned", "Company Revenue", "Paid Status", "Date"])
    payouts = session.exec(select(Disbursement)).all()
    for p in payouts:
        writer.writerow([p.id, p.lead_id, p.disbursed_amount, p.commission_earned, p.company_revenue, p.commission_paid_status, p.disbursement_date])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=finconnect_export.csv"}
    )

@router.get("/payouts")
def get_payouts(session: Session = Depends(get_session)):
    # Fetch all disbursements with related lead and ambassador info
    results = session.exec(
        select(Disbursement, Lead, Ambassador)
        .join(Lead, Disbursement.lead_id == Lead.id)
        .join(Ambassador, Lead.ambassador_id == Ambassador.id)
    ).all()
    
    payouts = []
    for disbursement, lead, ambassador in results:
        payouts.append({
            "id": disbursement.id,
            "amount": disbursement.commission_earned,
            "disbursed_amount": disbursement.disbursed_amount,
            "company_revenue": disbursement.company_revenue,
            "status": "Paid" if disbursement.commission_paid_status else "Pending",
            "date": disbursement.disbursement_date,
            "paid_date": disbursement.commission_paid_date,
            "ambassador": {
                "name": ambassador.full_name,
                "email": ambassador.email,
                "college": ambassador.college_name
            },
            "lead": {
                "student_name": lead.student_name,
                "course": lead.course_and_university
            }
        })
    
    return payouts

@router.post("/payouts/{disbursement_id}/pay")
def mark_payout_as_paid(disbursement_id: UUID, session: Session = Depends(get_session)):
    disbursement = session.get(Disbursement, disbursement_id)
    if not disbursement:
        raise HTTPException(status_code=404, detail="Disbursement not found")
        
    if disbursement.commission_paid_status:
        raise HTTPException(status_code=400, detail="Commission already paid")
        
    disbursement.commission_paid_status = True
    disbursement.commission_paid_date = datetime.now(timezone.utc)
    
    session.add(disbursement)
    session.commit()
    session.refresh(disbursement)
    
    # Notify Ambassador
    from ..models import Notification, Lead
    lead = session.get(Lead, disbursement.lead_id)
    if lead and lead.ambassador_id:
        notif = Notification(
            recipient_type='ambassador',
            recipient_id=lead.ambassador_id,
            title='Commission Paid! 💰',
            message=f"Commission of ₹{disbursement.commission_earned} for {lead.student_name} has been processed."
        )
        session.add(notif)
        session.commit()
    
    return {"message": "Payout marked as paid", "paid_date": disbursement.commission_paid_date}

@router.delete("/leads/{lead_id}")
def delete_lead(lead_id: UUID, session: Session = Depends(get_session)):
    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Also delete related disbursements/notifications if cascading isn't set
    # but for simplicity we assume cascading or just delete the lead
    session.delete(lead)
    session.commit()
    return {"message": "Lead deleted successfully"}

@router.delete("/ambassadors/{amb_id}")
def delete_ambassador(amb_id: UUID, session: Session = Depends(get_session)):
    ambassador = session.get(Ambassador, amb_id)
    if not ambassador:
        raise HTTPException(status_code=404, detail="Ambassador not found")
    
    session.delete(ambassador)
    session.commit()
    return {"message": "Ambassador deleted successfully"}

from pydantic import BaseModel

class LeadCreateAdmin(BaseModel):
    student_name: str
    course_and_university: str
    loan_requirement: float
    current_city: str
    phone_number: str
    email: str
    ambassador_id: UUID | None = None

@router.post("/leads")
def admin_add_lead(lead_in: LeadCreateAdmin, session: Session = Depends(get_session)):
    new_lead = Lead(
        student_name=lead_in.student_name,
        course_and_university=lead_in.course_and_university,
        loan_requirement=lead_in.loan_requirement,
        current_city=lead_in.current_city,
        phone_number=lead_in.phone_number,
        email=lead_in.email,
        ambassador_id=lead_in.ambassador_id,
        status="Pending"
    )
    session.add(new_lead)
    session.commit()
    session.refresh(new_lead)
    return new_lead
