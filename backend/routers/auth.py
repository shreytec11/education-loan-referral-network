from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel import Session, select
from pydantic import BaseModel
from passlib.context import CryptContext
from database import get_session
from models import Ambassador, Admin, Lead, PasswordResetToken
from typing import Optional
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class AdminChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str  # For ambassador and student
    user_type: str  # 'ambassador' or 'student'

class AdminForgotPasswordRequest(BaseModel):
    username: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

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

# ─────────────────────────────────────────────────────
# CHANGE PASSWORD ENDPOINTS
# ─────────────────────────────────────────────────────

@router.post("/admin/change-password")
def admin_change_password(
    data: AdminChangePasswordRequest,
    admin: Admin = Depends(require_admin_token),
    session: Session = Depends(get_session)
):
    if not verify_password(data.current_password, admin.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    admin.password_hash = get_password_hash(data.new_password)
    session.add(admin)
    session.commit()
    return {"message": "Password updated successfully. Please log in again."}

@router.post("/ambassador/change-password")
def ambassador_change_password(
    data: ChangePasswordRequest,
    ambassador: Ambassador = Depends(require_ambassador_token),
    session: Session = Depends(get_session)
):
    if not verify_password(data.current_password, ambassador.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    ambassador.password_hash = get_password_hash(data.new_password)
    session.add(ambassador)
    session.commit()
    return {"message": "Password updated successfully"}

@router.post("/student/change-password")
def student_change_password(
    data: ChangePasswordRequest,
    lead: Lead = Depends(require_student_token),
    session: Session = Depends(get_session)
):
    if not verify_password(data.current_password, lead.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    lead.password_hash = get_password_hash(data.new_password)
    session.add(lead)
    session.commit()
    return {"message": "Password updated successfully"}

# ─────────────────────────────────────────────────────
# FORGOT PASSWORD ENDPOINTS
# ─────────────────────────────────────────────────────

@router.post("/forgot-password/request")
def forgot_password_request(data: ForgotPasswordRequest, session: Session = Depends(get_session)):
    """Request a password reset token. Token is returned (email simulation for MVP)."""
    user = None
    user_id = None

    if data.user_type == "ambassador":
        stmt = select(Ambassador).where(Ambassador.email == data.email)
        user = session.exec(stmt).first()
        if user:
            user_id = str(user.id)
    elif data.user_type == "student":
        stmt = select(Lead).where(Lead.contact_email == data.email)
        user = session.exec(stmt).first()
        if user:
            user_id = str(user.id)
    else:
        raise HTTPException(status_code=400, detail="Invalid user_type. Use 'ambassador' or 'student'.")

    # Always return a success message to prevent email enumeration
    if not user:
        return {"message": "If that email exists, a reset link has been sent."}

    # Invalidate old tokens for this user
    old_tokens = session.exec(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == user_id,
            PasswordResetToken.user_type == data.user_type,
            PasswordResetToken.used == False
        )
    ).all()
    for t in old_tokens:
        t.used = True
        session.add(t)

    reset_token = PasswordResetToken(
        user_id=user_id,
        user_type=data.user_type,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    session.add(reset_token)
    session.commit()
    session.refresh(reset_token)

    # In production: send email with link. For MVP: return token directly.
    return {
        "message": "Password reset token generated. In production, this would be emailed.",
        "reset_token": reset_token.token,  # Remove this in production
        "expires_in": "1 hour"
    }

@router.post("/forgot-password/admin/request")
def admin_forgot_password_request(data: AdminForgotPasswordRequest, session: Session = Depends(get_session)):
    """Request a password reset token for admin."""
    stmt = select(Admin).where(Admin.username == data.username)
    admin = session.exec(stmt).first()

    if not admin:
        return {"message": "If that username exists, a reset token has been generated."}

    old_tokens = session.exec(
        select(PasswordResetToken).where(
            PasswordResetToken.user_id == str(admin.id),
            PasswordResetToken.user_type == "admin",
            PasswordResetToken.used == False
        )
    ).all()
    for t in old_tokens:
        t.used = True
        session.add(t)

    reset_token = PasswordResetToken(
        user_id=str(admin.id),
        user_type="admin",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    session.add(reset_token)
    session.commit()
    session.refresh(reset_token)

    return {
        "message": "Reset token generated.",
        "reset_token": reset_token.token,
        "expires_in": "1 hour"
    }

@router.post("/forgot-password/reset")
def reset_password(data: ResetPasswordRequest, session: Session = Depends(get_session)):
    """Reset password using a valid token."""
    stmt = select(PasswordResetToken).where(PasswordResetToken.token == data.token)
    reset_entry = session.exec(stmt).first()

    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if reset_entry.used:
        raise HTTPException(status_code=400, detail="This reset token has already been used")
    if reset_entry.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    new_hash = get_password_hash(data.new_password)

    if reset_entry.user_type == "ambassador":
        from uuid import UUID as UUIDType
        user = session.get(Ambassador, UUIDType(reset_entry.user_id))
        if user:
            user.password_hash = new_hash
            session.add(user)
    elif reset_entry.user_type == "student":
        from uuid import UUID as UUIDType
        user = session.get(Lead, UUIDType(reset_entry.user_id))
        if user:
            user.password_hash = new_hash
            session.add(user)
    elif reset_entry.user_type == "admin":
        from uuid import UUID as UUIDType
        user = session.get(Admin, UUIDType(reset_entry.user_id))
        if user:
            user.password_hash = new_hash
            session.add(user)

    reset_entry.used = True
    session.add(reset_entry)
    session.commit()

    return {"message": "Password reset successfully. You can now log in with your new password."}
