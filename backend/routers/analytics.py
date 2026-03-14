from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from ..database import get_session
from ..models import Lead, Disbursement, Ambassador
from .auth import require_admin_token, require_ambassador_token
from uuid import UUID
from datetime import datetime

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/ambassadors/{ambassador_id}/performance")
def get_ambassador_performance(
    ambassador_id: UUID, 
    session: Session = Depends(get_session),
    current_ambassador: Ambassador = Depends(require_ambassador_token)
):
    if current_ambassador.id != ambassador_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this performance data")
        
    # Verify ambassador exists
    ambassador = session.get(Ambassador, ambassador_id)
    if not ambassador:
        raise HTTPException(status_code=404, detail="Ambassador not found")
    
    # 1. Total Leads
    total_leads = session.exec(select(func.count(Lead.id)).where(Lead.ambassador_id == ambassador_id)).one()
    
    # 2. Leads by Status
    leads_by_status = session.exec(
        select(Lead.status, func.count(Lead.id))
        .where(Lead.ambassador_id == ambassador_id)
        .group_by(Lead.status)
    ).all()
    
    # 3. Commission Breakdown (Paid vs Pending)
    # Join Lead and Disbursement
    earnings_data = session.exec(
        select(
            Disbursement.commission_paid_status,
            func.sum(Disbursement.commission_earned)
        )
        .join(Lead)
        .where(Lead.ambassador_id == ambassador_id)
        .group_by(Disbursement.commission_paid_status)
    ).all()
    
    total_commission = 0.0
    paid_commission = 0.0
    pending_commission = 0.0
    
    for status, amount in earnings_data:
        amt = amount or 0.0
        total_commission += amt
        if status: # True means Paid
            paid_commission += amt
        else:
            pending_commission += amt
            
    # 4. Recent Leads
    recent_leads = session.exec(
        select(Lead)
        .where(Lead.ambassador_id == ambassador_id)
        .order_by(Lead.created_at.desc())
        .limit(5)
    ).all()

    # Calculate Tier
    tier = "Bronze"
    next_tier_progress = 0.0
    
    if total_leads >= 50:
        tier = "Gold"
        next_tier_progress = 100.0
    elif total_leads >= 10:
        tier = "Silver"
        # Progress to Gold (10 to 50) => 40 leads gap
        next_tier_progress = ((total_leads - 10) / 40.0) * 100.0
    else:
        tier = "Bronze"
        # Progress to Silver (0 to 10)
        next_tier_progress = (total_leads / 10.0) * 100.0

    return {
        "ambassador": {
            "id": ambassador.id,
            "full_name": ambassador.full_name,
            "email": ambassador.email,
            "phone_number": ambassador.phone_number,
            "college_name": ambassador.college_name,
            "referral_code": ambassador.referral_code,
            "tier": tier,
            "next_tier_progress": min(next_tier_progress, 100.0)
        },
        "total_leads": total_leads,
        "status_breakdown": {status: count for status, count in leads_by_status},
        "total_earnings": total_commission,
        "paid_earnings": paid_commission,
        "pending_earnings": pending_commission,
        "recent_leads": recent_leads
    }

@router.get("/admin/performance", dependencies=[Depends(require_admin_token)])
def get_global_performance(session: Session = Depends(get_session)):
    # 1. Total Ambassadors
    total_ambassadors = session.exec(select(func.count(Ambassador.id))).one()
    
    # 2. Total Leads
    total_leads = session.exec(select(func.count(Lead.id))).one()
    
    # 3. Leads by Status
    leads_by_status = session.exec(
        select(Lead.status, func.count(Lead.id))
        .group_by(Lead.status)
    ).all()
    
    # 4. Financials
    financials = session.exec(
        select(
            func.sum(Disbursement.disbursed_amount),
            func.sum(Disbursement.company_revenue),
            func.sum(Disbursement.commission_earned)
        )
    ).first()
    
    total_disbursed = financials[0] or 0.0
    total_revenue = financials[1] or 0.0
    total_commission_paid = financials[2] or 0.0

    return {
        "total_ambassadors": total_ambassadors,
        "total_leads": total_leads,
        "status_breakdown": {status: count for status, count in leads_by_status},
        "financials": {
            "disbursed": total_disbursed,
            "revenue": total_revenue,
            "commission_distributed": total_commission_paid
        }
    }

@router.get("/admin/leads", dependencies=[Depends(require_admin_token)])
def get_all_leads(session: Session = Depends(get_session)):
    # Explicitly join tables to avoid ambiguity
    statement = (
        select(Lead, Ambassador.full_name, Ambassador.referral_code, Disbursement.disbursed_amount)
        .join(Ambassador, Lead.ambassador_id == Ambassador.id, isouter=True)
        .join(Disbursement, Lead.id == Disbursement.lead_id, isouter=True)
        .order_by(Lead.created_at.desc())
    )
    leads = session.exec(statement).all()
    
    # Transform for frontend
    result = []
    for lead, ambassador_name, ambassador_code, disbursed_amount in leads:
        result.append({
            "id": lead.id,
            "student_name": lead.student_name,
            "course": lead.course_and_university,
            "loan_amount": lead.loan_requirement,
            "status": lead.status,
            "created_at": lead.created_at,
            "ambassador": {
                "name": ambassador_name or "Direct",
                "code": ambassador_code or "N/A"
            },
            "disbursed_amount": disbursed_amount or 0.0,
            "admin_comments": lead.admin_comments
        })
    return result

@router.get("/admin/ambassadors", dependencies=[Depends(require_admin_token)])
def get_all_ambassadors(session: Session = Depends(get_session)):
    # Get ambassador details with lead counts and earnings in batch queries
    ambassadors = session.exec(select(Ambassador)).all()
    
    # Batch: lead counts per ambassador
    lead_counts_raw = session.exec(
        select(Lead.ambassador_id, func.count(Lead.id))
        .where(Lead.ambassador_id.isnot(None))
        .group_by(Lead.ambassador_id)
    ).all()
    lead_counts = {str(amb_id): count for amb_id, count in lead_counts_raw}
    
    # Batch: earnings per ambassador
    earnings_raw = session.exec(
        select(Lead.ambassador_id, func.sum(Disbursement.commission_earned))
        .join(Disbursement, Disbursement.lead_id == Lead.id)
        .where(Lead.ambassador_id.isnot(None))
        .group_by(Lead.ambassador_id)
    ).all()
    earnings_map = {str(amb_id): total or 0.0 for amb_id, total in earnings_raw}
    
    result = []
    for amb in ambassadors:
        amb_id_str = str(amb.id)
        result.append({
            "id": amb.id,
            "full_name": amb.full_name,
            "email": amb.email,
            "college": amb.college_name,
            "referral_code": amb.referral_code,
            "leads_generated": lead_counts.get(amb_id_str, 0),
            "total_earnings": earnings_map.get(amb_id_str, 0.0),
            "joined_at": amb.created_at
        })
    
    return result

@router.get("/leaderboard")
def get_leaderboard(session: Session = Depends(get_session)):
    # Top 5 Ambassadors by Leads Generated
    # We use join to calculate real-time leads count to be accurate
    statement = (
        select(Ambassador, func.count(Lead.id).label("lead_count"))
        .join(Lead, isouter=True)
        .group_by(Ambassador.id)
        .order_by(func.count(Lead.id).desc())
        .limit(5)
    )
    
    results = session.exec(statement).all()
    
    return [
        {
            "name": amb.full_name, 
            "college": amb.college_name,
            "leads": count
        }
        for amb, count in results
    ]
