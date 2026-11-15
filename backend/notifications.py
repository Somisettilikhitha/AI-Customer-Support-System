
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func

from database import SessionLocal
from auth import get_current_user
from models import Notification


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# ============================================================
# GET ALL NOTIFICATIONS
# GET /notifications/
# ============================================================

@router.get("/")
def get_notifications(
    user_id: int = Depends(get_current_user)
):
    db = SessionLocal()

    try:
        notifications = db.scalars(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        ).all()

        return [
            {
                "id": notification.id,
                "user_id": notification.user_id,
                "ticket_id": notification.ticket_id,
                "notification_type": notification.notification_type,
                "title": notification.title,
                "message": notification.message,
                "is_read": notification.is_read,
                "created_at": notification.created_at,
            }
            for notification in notifications
        ]

    finally:
        db.close()


# ============================================================
# GET UNREAD NOTIFICATION COUNT
# GET /notifications/unread-count
# ============================================================

@router.get("/unread-count")
def get_unread_count(
    user_id: int = Depends(get_current_user)
):
    db = SessionLocal()

    try:
        count = db.scalar(
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        )

        return {
            "unread_count": count or 0
        }

    finally:
        db.close()


# ============================================================
# MARK ONE NOTIFICATION AS READ
# PATCH /notifications/{notification_id}/read
# ============================================================

@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    user_id: int = Depends(get_current_user)
):
    db = SessionLocal()

    try:
        notification = db.scalar(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        )

        if notification is None:
            raise HTTPException(
                status_code=404,
                detail="Notification not found"
            )

        notification.is_read = True

        db.commit()

        return {
            "message": "Notification marked as read",
            "notification_id": notification.id
        }

    finally:
        db.close()


# ============================================================
# MARK ALL NOTIFICATIONS AS READ
# PATCH /notifications/read-all
# ============================================================

@router.patch("/read-all")
def mark_all_notifications_as_read(
    user_id: int = Depends(get_current_user)
):
    db = SessionLocal()

    try:
        notifications = db.scalars(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        ).all()

        for notification in notifications:
            notification.is_read = True

        db.commit()

        return {
            "message": "All notifications marked as read",
            "updated_count": len(notifications)
        }

    finally:
        db.close()
