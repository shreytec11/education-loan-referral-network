from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship
import secrets

class Ambassador(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    full_name: str
    email: str = Field(unique=True, index=True)
    phone_number: str
    college_name: str
    referral_code: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    leads: list["Lead"] = Relationship(back_populates="ambassador")
    password_hash: Optional[str] = Field(default=None)

class Admin(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Lead(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    student_name: str
    contact_email: str
    contact_phone: str
    course_and_university: str
    loan_requirement: float
    
    # We track both the code used and the resolved ambassador ID
    referral_code_used: Optional[str] = None 
    ambassador_id: Optional[UUID] = Field(default=None, foreign_key="ambassador.id")
    
    status: str = Field(default="Pending") # Pending, Processing, Approved, Disbursed, Rejected
    admin_comments: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    ambassador: Optional[Ambassador] = Relationship(back_populates="leads")
    disbursement: Optional["Disbursement"] = Relationship(back_populates="lead")
    documents: list["Document"] = Relationship(back_populates="lead")
    password_hash: Optional[str] = Field(default=None)

class Notification(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    recipient_type: str  # 'admin', 'ambassador', 'student'
    recipient_id: Optional[UUID] = Field(default=None) # Null for 'admin' (all admins)
    title: str
    message: str
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Document(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    lead_id: UUID = Field(foreign_key="lead.id")
    filename: str
    file_path: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = Field(default="Pending") # Pending, Verified, Rejected
    admin_comments: Optional[str] = None
    
    lead: Lead = Relationship(back_populates="documents")

class Disbursement(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    lead_id: UUID = Field(foreign_key="lead.id")
    disbursed_amount: float
    commission_earned: float
    company_revenue: float = Field(default=0.0)
    disbursement_date: datetime
    commission_paid_status: bool = Field(default=False)
    commission_paid_date: Optional[datetime] = None

    lead: Lead = Relationship(back_populates="disbursement")

class SystemSettings(SQLModel, table=True):
    id: int = Field(default=1, primary_key=True) # Only one row
    company_revenue_rate: float = Field(default=0.7) # 0.7%
    ambassador_commission_rate: float = Field(default=0.3) # 0.3%
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PasswordResetToken(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str  # Stored as string to support UUID from different tables
    user_type: str  # 'admin', 'ambassador', 'student'
    token: str = Field(default_factory=lambda: secrets.token_urlsafe(32), unique=True, index=True)
    expires_at: datetime
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
