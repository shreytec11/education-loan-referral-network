from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import Ambassador, Notification
from uuid import UUID

router = APIRouter(prefix="/api/ambassadors", tags=["Ambassadors"])

from pydantic import BaseModel
from routers.auth import get_password_hash, require_ambassador_token

class AmbassadorCreate(BaseModel):
    full_name: str
    email: str
    phone_number: str
    college_name: str
    referral_code: str
    password: str

class AmbassadorUpdate(BaseModel):
    email: str | None = None
    phone_number: str | None = None
    college_name: str | None = None

@router.post("/", response_model=Ambassador)
def create_ambassador(ambassador_in: AmbassadorCreate, session: Session = Depends(get_session)):
    # Check for existing email or referral code
    statement = select(Ambassador).where(
        (Ambassador.email == ambassador_in.email) | 
        (Ambassador.referral_code == ambassador_in.referral_code)
    )
    results = session.exec(statement).first()
    if results:
        raise HTTPException(status_code=400, detail="Email or Referral Code already exists")
    
    # Create DB model from input
    ambassador = Ambassador(
        full_name=ambassador_in.full_name,
        email=ambassador_in.email,
        phone_number=ambassador_in.phone_number,
        college_name=ambassador_in.college_name,
        referral_code=ambassador_in.referral_code,
        password_hash=get_password_hash(ambassador_in.password)
    )
    
    session.add(ambassador)
    session.commit()
    session.refresh(ambassador)
    return ambassador

@router.get("/{role_id}", response_model=Ambassador)
def read_ambassador(
    role_id: UUID, 
    session: Session = Depends(get_session),
    current_ambassador: Ambassador = Depends(require_ambassador_token)
):
    if current_ambassador.id != role_id:
        raise HTTPException(status_code=403, detail="Not authorized to read this profile")
    return current_ambassador

@router.patch("/{role_id}", response_model=Ambassador)
def update_ambassador(
    role_id: UUID, 
    ambassador_in: AmbassadorUpdate, 
    session: Session = Depends(get_session),
    current_ambassador: Ambassador = Depends(require_ambassador_token)
):
    if current_ambassador.id != role_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
    
    update_data = ambassador_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_ambassador, key, value)
    
    session.add(current_ambassador)
    session.commit()
    session.refresh(current_ambassador)
    return current_ambassador

class WithdrawRequest(BaseModel):
    amount: float

@router.post("/{role_id}/withdraw")
def request_withdrawal(
    role_id: UUID, 
    data: WithdrawRequest, 
    session: Session = Depends(get_session),
    current_ambassador: Ambassador = Depends(require_ambassador_token)
):
    if current_ambassador.id != role_id:
        raise HTTPException(status_code=403, detail="Not authorized to request withdrawal")
        
    # We create an Admin notification for the requested payout
    admin_notif = Notification(
        recipient_type='admin',
        title='Payout Requested 💸',
        message=f"Ambassador {current_ambassador.full_name} has requested a payout of ₹{data.amount:,.0f}."
    )
    session.add(admin_notif)
    session.commit()
    
    return {"message": "Payout request submitted successfully"}
