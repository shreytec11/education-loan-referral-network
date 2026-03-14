from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel import Session, select
from pydantic import BaseModel
from passlib.context import CryptContext
from ..database import get_session
from ..models import Ambassador, Admin, Lead
from typing import Optional

router = APIRouter(prefix="/api/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str

class AdminLoginRequest(BaseModel):
    username: str
    password: str

def verify_password(plain_password, hashed_password):
    if not hashed_password: return False
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@router.post("/ambassador/login")
def ambassador_login(data: LoginRequest, session: Session = Depends(get_session)):
    statement = select(Ambassador).where(Ambassador.email == data.email)
    ambassador = session.exec(statement).first()
    
    if not ambassador:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, ambassador.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "id": ambassador.id,
        "full_name": ambassador.full_name,
        "referral_code": ambassador.referral_code,
        "message": "Login successful"
    }

@router.post("/student/login")
def student_login(data: LoginRequest, session: Session = Depends(get_session)):
    statement = select(Lead).where(Lead.contact_email == data.email)
    lead = session.exec(statement).first()
    
    if not lead:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check hashed password, or auto-set default password hash on first login
    if not lead.password_hash:
        # First login: verify against default and set hash
        if data.password == "123456":
             lead.password_hash = get_password_hash("123456")
             session.add(lead)
             session.commit()
        else:
             raise HTTPException(status_code=401, detail="Invalid credentials")
    elif not verify_password(data.password, lead.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "id": lead.id,
        "full_name": lead.student_name,
        "status": lead.status,
        "message": "Login successful"
    }

@router.post("/admin/login")
def admin_login(data: AdminLoginRequest, session: Session = Depends(get_session)):
    statement = select(Admin).where(Admin.username == data.username)
    admin = session.exec(statement).first()
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
    if not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
    return {"token": str(admin.id), "message": "Login successful"}

def require_admin_token(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session)
):
    """Dependency to protect admin-only endpoints."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing admin token")
    
    token = authorization.replace("Bearer ", "")
    try:
        from uuid import UUID as UUIDType
        admin_id = UUIDType(token)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Invalid admin token")
    
    admin = session.get(Admin, admin_id)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return admin

def require_ambassador_token(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session)
):
    """Dependency to protect ambassador-only endpoints."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing ambassador token")
    
    token = authorization.replace("Bearer ", "")
    try:
        from uuid import UUID as UUIDType
        ambassador_id = UUIDType(token)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Invalid ambassador token")
    
    ambassador = session.get(Ambassador, ambassador_id)
    if not ambassador:
        raise HTTPException(status_code=401, detail="Invalid ambassador token")
    return ambassador

def require_student_token(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session)
):
    """Dependency to protect student-only endpoints."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing student token")
    
    token = authorization.replace("Bearer ", "")
    try:
        from uuid import UUID as UUIDType
        lead_id = UUIDType(token)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Invalid student token")
    
    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=401, detail="Invalid student token")
    return lead

@router.post("/ambassador/register-password")
def set_ambassador_password(data: LoginRequest, session: Session = Depends(get_session)):
    # Helper for MVP to set password for an email
    statement = select(Ambassador).where(Ambassador.email == data.email)
    ambassador = session.exec(statement).first()
    
    if not ambassador:
        raise HTTPException(status_code=404, detail="Ambassador not found")
        
    ambassador.password_hash = get_password_hash(data.password)
    session.add(ambassador)
    session.commit()
    
    return {"message": "Password updated successfully"}
