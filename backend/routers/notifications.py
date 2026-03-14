from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from ..database import get_session
from ..models import Notification
from uuid import UUID

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/", response_model=List[Notification])
def get_notifications(
    recipient_type: str, 
    recipient_id: Optional[UUID] = None, 
    session: Session = Depends(get_session)
):
    # If admin, fetch all admin notifications
    if recipient_type == 'admin':
        statement = select(Notification).where(Notification.recipient_type == 'admin').order_by(Notification.created_at.desc())
    elif recipient_id:
        if recipient_type not in ['ambassador', 'student']:
             raise HTTPException(status_code=400, detail="Invalid recipient type")
             
        statement = select(Notification).where(
            Notification.recipient_type == recipient_type,
            Notification.recipient_id == recipient_id
        ).order_by(Notification.created_at.desc())
    else:
        return []
        
    return session.exec(statement).all()

@router.put("/{notification_id}/read")
def mark_as_read(notification_id: UUID, session: Session = Depends(get_session)):
    notif = session.get(Notification, notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    session.add(notif)
    session.commit()
    return {"message": "Marked as read"}

@router.post("/mark-all-read")
def mark_all_as_read(
    recipient_type: str, 
    recipient_id: Optional[UUID] = None, 
    session: Session = Depends(get_session)
):
    if recipient_type == 'admin':
        statement = select(Notification).where(Notification.recipient_type == 'admin', Notification.is_read == False)
    elif recipient_id:
        if recipient_type not in ['ambassador', 'student']:
             raise HTTPException(status_code=400, detail="Invalid recipient type")
        statement = select(Notification).where(
            Notification.recipient_type == recipient_type,
            Notification.recipient_id == recipient_id,
            Notification.is_read == False
        )
    else:
        return {"message": "Invalid request"}
        
    notifs = session.exec(statement).all()
    count = 0
    for n in notifs:
        n.is_read = True
        session.add(n)
        count += 1
    session.commit()
    return {"message": f"Marked {count} notifications as read", "marked_count": count}
