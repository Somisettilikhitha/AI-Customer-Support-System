
from sqlalchemy.orm import Session

from models import Notification


def create_notification(
    db: Session,
    user_id: int,
    ticket_id: int,
    notification_type: str,
    title: str,
    message: str,
):
    """
    Create a notification for a user.

    The caller is responsible for committing
    the database transaction.
    """

    notification = Notification(
        user_id=user_id,
        ticket_id=ticket_id,
        notification_type=notification_type,
        title=title,
        message=message,
        is_read=False,
    )

    db.add(notification)

    return notification
