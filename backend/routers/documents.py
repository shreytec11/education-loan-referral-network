from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List, Optional
from ..database import get_session
from ..models import Lead, Document
from uuid import UUID
from .auth import require_student_token
import shutil
import os
from datetime import datetime

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/upload")
def upload_document(
    lead_id: UUID = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_student: Lead = Depends(require_student_token)
):
    if current_student.id != lead_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload documents for this lead")
    # Verify lead exists
    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    # Generate safe filename
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{lead_id}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
        
    # Create Document record
    doc = Document(
        lead_id=lead_id,
        filename=file.filename,
        file_path=file_path
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)
    
    # Notify Admin
    from ..models import Notification
    admin_notif = Notification(
        recipient_type='admin',
        title='New Document Uploaded',
        message=f"{lead.student_name} uploaded {file.filename}."
    )
    session.add(admin_notif)
    session.commit()
    
    return doc

from fastapi.responses import FileResponse
@router.get("/file/{document_id}")
def get_document_file(document_id: UUID, session: Session = Depends(get_session)):
    doc = session.get(Document, document_id)
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(doc.file_path)

@router.get("/{lead_id}", response_model=List[Document])
def get_documents(
    lead_id: UUID, 
    session: Session = Depends(get_session),
    current_student: Lead = Depends(require_student_token)
):
    # This route is mainly used by student dashboard in the UI right now.
    if current_student.id != lead_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    statement = select(Document).where(Document.lead_id == lead_id)
    results = session.exec(statement).all()
    return results

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
    
    from ..models import Disbursement
    
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
    
    # Include disbursement details if disbursed
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
    
    doc.status = update.status
    doc.admin_comments = update.admin_comments
    session.add(doc)
    session.commit()
    
    # Notify Student if rejected or verified
    from ..models import Notification
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
    
    return doc
