from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from ..database import get_session
from ..models import Lead, Ambassador, Disbursement, Notification
from datetime import datetime, timezone
from uuid import UUID

router = APIRouter(prefix="/api/leads", tags=["Leads"])

class LeadCreate(BaseModel):
    student_name: str
    contact_email: str
    contact_phone: str
    course_and_university: str
    loan_requirement: float
    referral_code: Optional[str] = None

@router.post("/")
def create_lead(lead_data: LeadCreate, session: Session = Depends(get_session)):
    # Auto-tagging logic
    ambassador_id = None
    if lead_data.referral_code:
        statement = select(Ambassador).where(Ambassador.referral_code == lead_data.referral_code)
        ambassador = session.exec(statement).first()
        if ambassador:
            ambassador_id = ambassador.id
        # If no ambassador found, we still create the lead but check if it should be flagged?
        # Requirement 5: If no match found, flag as Organic (done by default as ambassador_id is None)
    
    lead = Lead(
        student_name=lead_data.student_name,
        contact_email=lead_data.contact_email,
        contact_phone=lead_data.contact_phone,
        course_and_university=lead_data.course_and_university,
        loan_requirement=lead_data.loan_requirement,
        referral_code_used=lead_data.referral_code,
        ambassador_id=ambassador_id,
        status="Pending"
    )
    
    session.add(lead)
    session.commit()
    session.refresh(lead)

    # 🔔 Notify Admin
    admin_notif = Notification(
        recipient_type='admin',
        title='New Lead Registered',
        message=f"New lead from {lead.student_name} received.",
    )
    session.add(admin_notif)

    # 🔔 Notify Ambassador (if exists)
    if ambassador_id:
        amb_notif = Notification(
            recipient_type='ambassador',
            recipient_id=ambassador_id,
            title='New Referral!',
            message=f"Your referral code was used by {lead.student_name}."
        )
        session.add(amb_notif)
    
    session.commit()
    return {
        "id": str(lead.id),
        "student_name": lead.student_name,
        "status": lead.status
    }

# Commission Calculation
def calculate_commission(disbursed_amount: float, session: Session) -> dict:
    """Calculate commission breakdown for a disbursed loan using dynamic settings."""
    from ..models import SystemSettings
    settings = session.get(SystemSettings, 1)
    if not settings:
        settings = SystemSettings(id=1)
        
    amb_rate = settings.ambassador_commission_rate / 100
    comp_rate = settings.company_revenue_rate / 100
    
    total_bank_income = disbursed_amount * (amb_rate + comp_rate)
    ambassador_commission = disbursed_amount * amb_rate
    company_revenue = disbursed_amount * comp_rate
    return {
        "total_bank_income": total_bank_income,
        "ambassador_commission": ambassador_commission,
        "company_revenue": company_revenue,
    }

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    admin_comments: Optional[str] = None

@router.patch("/{lead_id}")
def update_lead(lead_id: UUID, update_data: LeadUpdate, session: Session = Depends(get_session)):
    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if update_data.status:
        # Block setting status to "Disbursed" via PATCH — must use POST /disburse endpoint
        if update_data.status == "Disbursed":
            raise HTTPException(
                status_code=400,
                detail="Use the /disburse endpoint to mark a lead as Disbursed with the loan amount."
            )
        lead.status = update_data.status
        
    if update_data.admin_comments is not None:
        lead.admin_comments = update_data.admin_comments
        
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return {
        "id": str(lead.id),
        "status": lead.status,
        "admin_comments": lead.admin_comments
    }

class DisburseRequest(BaseModel):
    disbursed_amount: float

@router.post("/{lead_id}/disburse")
def mark_disbursed(lead_id: UUID, body: DisburseRequest, session: Session = Depends(get_session)):
    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead.status == "Disbursed":
        raise HTTPException(status_code=400, detail="Lead is already disbursed")
    
    # Calculate commission breakdown
    breakdown = calculate_commission(body.disbursed_amount, session)
    
    ambassador_commission = breakdown["ambassador_commission"] if lead.ambassador_id else 0.0
    company_revenue = breakdown["total_bank_income"] - ambassador_commission
    
    disbursement = Disbursement(
        lead_id=lead_id,
        disbursed_amount=body.disbursed_amount,
        commission_earned=ambassador_commission,
        company_revenue=company_revenue,
        disbursement_date=datetime.now(timezone.utc),
        commission_paid_status=False
    )
    
    lead.status = "Disbursed"
    
    session.add(disbursement)
    session.add(lead)
    session.commit()
    session.refresh(disbursement)
    
    # 🔔 Notify Ambassador about earned commission
    if lead.ambassador_id and ambassador_commission > 0:
        notif = Notification(
            recipient_type='ambassador',
            recipient_id=lead.ambassador_id,
            title='Commission Earned! 🎉',
            message=f"Loan for {lead.student_name} has been disbursed (₹{body.disbursed_amount:,.0f}). "
                    f"You earned ₹{ambassador_commission:,.0f} commission! "
                    f"Your commission will be processed and added to your account within 7 business days."
        )
        session.add(notif)
    
    # 🔔 Notify Student about disbursement
    student_notif = Notification(
        recipient_type='student',
        recipient_id=lead.id,
        title='Loan Approved & Disbursed! 🎉',
        message=f"Great news! Your loan of ₹{body.disbursed_amount:,.0f} has been approved and disbursed. "
                f"After final verification, the amount will be deposited into your account within 15-20 business days."
    )
    session.add(student_notif)
    session.commit()
    
    return {
        "message": "Lead disbursed successfully",
        "disbursement_id": disbursement.id,
        "disbursed_amount": body.disbursed_amount,
        "ambassador_commission": ambassador_commission,
        "company_revenue": company_revenue,
        "total_bank_income": breakdown["total_bank_income"],
    }

