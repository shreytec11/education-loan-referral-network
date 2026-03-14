from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlmodel import Session, select
from pydantic import BaseModel, field_validator, EmailStr
from passlib.context import CryptContext
from database import get_session
from models import Ambassador, Admin, Lead, PasswordResetToken
from typing import Optional, Literal
from datetime import datetime, timezone, timedelta
from logging_config import logger
from slowapi import Limiter
from slowapi.util import get_remote_address
import os, resend

router = APIRouter(prefix="/api/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# ── Rate limiter (shared with main.py) ────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── Resend email setup ────────────────────────────────────────────
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM    = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
FRONTEND_URL   = os.getenv("FRONTEND_URL", "http://localhost:3000").split(",")[0].strip()

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY
    logger.info("Resend email configured")
else:
    logger.warning("RESEND_API_KEY not set — emails will be skipped (token returned in response)")

def send_reset_email(to_email: str, token: str, user_type: str):
    """Send password reset email via Resend. Falls back gracefully if not configured."""
    if not RESEND_API_KEY:
        return {"success": False, "reason": "not_configured"}
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}&type={user_type}"
    try:
        resend.Emails.send({
            "from": RESEND_FROM,
            "to": [to_email],
            "subject": "Reset your FinConnect password",
            "html": f"""
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:2rem">
                <h2 style="color:#6366f1">Password Reset Request</h2>
                <p>We received a request to reset your password. Click the button below to set a new password.</p>
                <a href="{reset_link}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:1rem 0">
                    Reset My Password
                </a>
                <p style="color:#666;font-size:0.85rem">This link expires in <strong>1 hour</strong>. If you did not request this, you can safely ignore this email.</p>
                <hr style="border:none;border-top:1px solid #eee;margin:1.5rem 0"/>
                <p style="color:#999;font-size:0.75rem">FinConnect — Education Loan Platform</p>
            </div>
            """
        })
        logger.info(f"Reset email sent to {to_email} for {user_type}")
        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to send reset email: {e}")
        return {"success": False, "reason": str(e)}

# ── Schemas ─────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 1:
            raise ValueError("Password cannot be empty")
        if len(v) > 128:
            raise ValueError("Password too long")
        return v

class AdminLoginRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_length(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Username cannot be empty")
        return v.strip()

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def pw_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if len(v) > 128:
            raise ValueError("Password too long")
        return v

class AdminChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def pw_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        if len(v) > 128:
            raise ValueError("Password too long")
        return v

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    user_type: Literal["ambassador", "student"]

class AdminForgotPasswordRequest(BaseModel):
    username: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def pw_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

# ── Helpers ──────────────────────────────────────────────────────

def verify_password(plain_password, hashed_password):
    if not hashed_password: return False
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# ── Login Endpoints (rate-limited) ───────────────────────────────

@router.post("/ambassador/login")
@limiter.limit("10/minute")
def ambassador_login(request: Request, data: LoginRequest, session: Session = Depends(get_session)):
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
@limiter.limit("10/minute")
def student_login(request: Request, data: LoginRequest, session: Session = Depends(get_session)):
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
    
    logger.info(f"Student login: {lead.contact_email}")
    return {
        "id": lead.id,
        "full_name": lead.student_name,
        "status": lead.status,
        "message": "Login successful"
    }

@router.post("/admin/login")
@limiter.limit("10/minute")
def admin_login(request: Request, data: AdminLoginRequest, session: Session = Depends(get_session)):
    statement = select(Admin).where(Admin.username == data.username)
    admin = session.exec(statement).first()
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
    if not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    logger.info(f"Admin login: {admin.username}")
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
@limiter.limit("5/minute")
def forgot_password_request(request: Request, data: ForgotPasswordRequest, session: Session = Depends(get_session)):
    """Request a password reset. Sends email via Resend if configured, otherwise returns token (dev mode)."""
    user = None
    user_id = None
    user_email = str(data.email)

    if data.user_type == "ambassador":
        stmt = select(Ambassador).where(Ambassador.email == user_email)
        user = session.exec(stmt).first()
        if user:
            user_id = str(user.id)
    elif data.user_type == "student":
        stmt = select(Lead).where(Lead.contact_email == user_email)
        user = session.exec(stmt).first()
        if user:
            user_id = str(user.id)

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

    email_result = send_reset_email(user_email, reset_token.token, data.user_type)

    if email_result["success"]:
        logger.info(f"Password reset email sent to {user_email} [{data.user_type}]")
        return {"message": "Password reset link sent to your email. It expires in 1 hour."}
    elif email_result["reason"] == "not_configured":
        # Dev/fallback mode: return token in response
        logger.warning(f"Email not sent (no Resend key). Returning token for {user_email}")
        return {
            "message": "Email not configured. Use the token below (dev mode only).",
            "reset_token": reset_token.token,
            "expires_in": "1 hour"
        }
    else:
        # Resend threw an error (e.g., domain not verified, bad api key)
        logger.error(f"Resend error: {email_result['reason']}")
        raise HTTPException(
            status_code=500, 
            detail=f"Email delivery failed. Resend Error: {email_result['reason']}"
        )

@router.post("/forgot-password/admin/request")
@limiter.limit("5/minute")
def admin_forgot_password_request(request: Request, data: AdminForgotPasswordRequest, session: Session = Depends(get_session)):
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

    # Admin has no email stored — always return token
    # In production, store admin email and send via Resend
    return {
        "message": "Reset token generated (admin emails coming soon).",
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
