from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import RedirectResponse, FileResponse
from sqlmodel import Session, select
from typing import List, Optional
from database import get_session
from models import Lead, Document
from uuid import UUID
from routers.auth import require_student_token
from logging_config import logger
import shutil
import os
from datetime import datetime

router = APIRouter(prefix="/api/documents", tags=["Documents"])

# ── Supabase Storage setup ────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
BUCKET = "documents"

def _get_supabase():
    """Return a Supabase client if credentials are available, else None."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    try:
        from supabase import create_client
        return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    except Exception as e:
        logger.error(f"Failed to init Supabase client: {e}")
        return None

# ── Local fallback dir (for local dev only) ────────────────────────
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

def upload_file_to_storage(file: UploadFile, lead_id: UUID) -> str:
    """
    Upload to Supabase Storage if configured; otherwise save locally.
    Returns the public URL or local file path.
    """
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    safe_name = f"{lead_id}/{timestamp}_{file.filename}"
    file_bytes = file.file.read()

    supabase = _get_supabase()
    if supabase:
        try:
            supabase.storage.from_(BUCKET).upload(
                path=safe_name,
                file=file_bytes,
                file_options={"content-type": file.content_type or "application/octet-stream", "upsert": "false"},
            )
            # Build public URL
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{safe_name}"
            logger.info(f"Uploaded to Supabase Storage: {safe_name}")
            return public_url
        except Exception as e:
            logger.error(f"Supabase upload failed, falling back to local: {e}")

    # Fallback: local disk (dev mode)
    local_path = os.path.join(UPLOAD_DIR, f"{lead_id}_{timestamp}_{file.filename}")
    with open(local_path, "wb") as buf:
        buf.write(file_bytes)
    logger.warning(f"Saved file locally (Supabase not configured): {local_path}")
    return local_path


@router.post("/upload")
def upload_document(
    lead_id: UUID = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_student: Lead = Depends(require_student_token)
):
    if current_student.id != lead_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload documents for this lead")

    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Validate file type
    ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, PNG, and WebP files are allowed")

    # Validate file size (max 10 MB)
    MAX_BYTES = 10 * 1024 * 1024
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_BYTES:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10 MB")

    file_url = upload_file_to_storage(file, lead_id)

    doc = Document(
        lead_id=lead_id,
        filename=file.filename,
        file_path=file_url
    )
    session.add(doc)

    # Notify Admin
    from models import Notification
    admin_notif = Notification(
        recipient_type='admin',
        title='New Document Uploaded',
        message=f"{lead.student_name} uploaded '{file.filename}'."
    )
    session.add(admin_notif)
    session.commit()
    session.refresh(doc)

    logger.info(f"Document uploaded for lead {lead_id}: {file.filename}")
    return doc


@router.get("/file/{document_id}")
def get_document_file(document_id: UUID, session: Session = Depends(get_session)):
    doc = session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")

    # If it's a URL (Supabase), redirect to CDN
    if doc.file_path.startswith("http"):
        return RedirectResponse(url=doc.file_path)

    # Legacy local path fallback
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(doc.file_path)


@router.get("/{lead_id}", response_model=List[Document])
def get_documents(
    lead_id: UUID,
    session: Session = Depends(get_session),
    current_student: Lead = Depends(require_student_token)
):
    if current_student.id != lead_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    statement = select(Document).where(Document.lead_id == lead_id)
    return session.exec(statement).all()


@router.get("/lead/{lead_id}")
def get_lead_status(
    lead_id: UUID,
    session: Session = Depends(get_session),
    current_student: Lead = Depends(require_student_token)
):
    if current_student.id != lead_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    from models import Disbursement
    result = {
        "id": lead.id,
        "student_name": lead.student_name,
        "status": lead.status,
        "loan_requirement": lead.loan_requirement,
        "course": lead.course_and_university,
        "admin_comments": lead.admin_comments,
        "created_at": lead.created_at,
        "disbursed_amount": None,
        "disbursement_date": None,
    }
    if lead.status == "Disbursed":
        disbursement = session.exec(
            select(Disbursement).where(Disbursement.lead_id == lead_id)
        ).first()
        if disbursement:
            result["disbursed_amount"] = disbursement.disbursed_amount
            result["disbursement_date"] = disbursement.disbursement_date
    return result


from pydantic import BaseModel

class DocumentUpdate(BaseModel):
    status: str
    admin_comments: Optional[str] = None

@router.patch("/{document_id}/verify")
def verify_document(document_id: UUID, update: DocumentUpdate, session: Session = Depends(get_session)):
    doc = session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    VALID_STATUSES = {"Verified", "Rejected", "Pending"}
    if update.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(VALID_STATUSES)}")

    doc.status = update.status
    doc.admin_comments = update.admin_comments
    session.add(doc)

    from models import Notification
    lead = session.get(Lead, doc.lead_id)
    if lead:
        status_msg = "approved ✅" if update.status == "Verified" else "rejected ❌"
        notif = Notification(
            recipient_type='student',
            recipient_id=lead.id,
            title=f'Document {status_msg}',
            message=f"Your document '{doc.filename}' was {status_msg}. {update.admin_comments or ''}"
        )
        session.add(notif)
    session.commit()
    logger.info(f"Document {document_id} verified as {update.status}")
    return doc
