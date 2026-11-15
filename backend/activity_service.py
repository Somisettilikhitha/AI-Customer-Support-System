from sqlalchemy.orm import Session

from models import TicketActivity


def create_ticket_activity(
    db: Session,
    ticket_id: int,
    user_id: int | None,
    action: str,
    description: str,
    old_value: str | None = None,
    new_value: str | None = None,
) -> TicketActivity:
    """
    Create and save a ticket activity/audit record.
    """

    activity = TicketActivity(
        ticket_id=ticket_id,
        user_id=user_id,
        action=action,
        old_value=old_value,
        new_value=new_value,
        description=description,
    )

    db.add(activity)
    db.flush()

    return activity