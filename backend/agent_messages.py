from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from database import SessionLocal
from models import Ticket, TicketMessage
from auth import get_current_agent
from activity_service import create_ticket_activity
from notification_service import create_notification

from message_schemas import (
    MessageCreate,
    MessageResponse
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/agent",
    tags=["Agent Messages"]
)


# ============================================================
# AGENT SEND MESSAGE
# POST /agent/tickets/{ticket_id}/messages
# ============================================================

@router.post(
    "/tickets/{ticket_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED
)
def agent_reply(
    ticket_id: int,
    message_data: MessageCreate,
    agent_id: int = Depends(get_current_agent)
):

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # FIND TICKET
        # ----------------------------------------------------

        ticket = db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id
            )
        )

        if ticket is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )

        # ----------------------------------------------------
        # VERIFY ASSIGNED AGENT
        # ----------------------------------------------------

        if ticket.assigned_agent_id != agent_id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This ticket is not assigned to you"
            )

        # ----------------------------------------------------
        # VALIDATE MESSAGE
        # ----------------------------------------------------

        message_text = message_data.message.strip()

        if not message_text:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty"
            )

        # ----------------------------------------------------
        # SAVE OLD STATUS
        # ----------------------------------------------------

        old_status = ticket.status

        # ----------------------------------------------------
        # CREATE MESSAGE
        # ----------------------------------------------------

        message = TicketMessage(
            ticket_id=ticket.id,
            sender_id=agent_id,
            sender_role="agent",
            message=message_text
        )

        db.add(message)

        # ----------------------------------------------------
        # UPDATE TICKET STATUS
        # ----------------------------------------------------

        if ticket.status in [
            "open",
            "assigned"
        ]:

            ticket.status = "in_progress"

        # ----------------------------------------------------
        # CREATE MESSAGE ACTIVITY
        # ----------------------------------------------------

        create_ticket_activity(
            db=db,
            ticket_id=ticket.id,
            user_id=agent_id,
            action="message_sent",
            old_value=None,
            new_value=message_text,
            description="Agent sent a message"
        )

        # ----------------------------------------------------
        # CREATE STATUS ACTIVITY
        # ----------------------------------------------------

        if old_status != ticket.status:

            create_ticket_activity(
                db=db,
                ticket_id=ticket.id,
                user_id=agent_id,
                action="status_changed",
                old_value=old_status,
                new_value=ticket.status,
                description=(
                    f"Ticket status changed from "
                    f"{old_status} to {ticket.status}"
                )
            )

        # ----------------------------------------------------
        # Create notification for the customer
        # ----------------------------------------------------
        
        create_notification(
            db=db,
            user_id=ticket.user_id,
            ticket_id=ticket.id,
            notification_type="agent_reply",
            title="New Reply on Your Ticket",
            message=(
                f"Support Agent replied to Ticket "
                f"#{ticket.id}: {ticket.title}"
            )
        )

        # ----------------------------------------------------
        # SAVE
        # ----------------------------------------------------

        db.commit()

        db.refresh(message)

        return message

    except HTTPException:

        raise

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(error)}"
        )

    finally:

        db.close()


# ============================================================
# GET AGENT CONVERSATION
# GET /agent/tickets/{ticket_id}/messages
# ============================================================

@router.get(
    "/tickets/{ticket_id}/messages",
    response_model=list[MessageResponse]
)
def get_agent_messages(
    ticket_id: int,
    agent_id: int = Depends(get_current_agent)
):

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # FIND TICKET
        # ----------------------------------------------------

        ticket = db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id
            )
        )

        if ticket is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )

        # ----------------------------------------------------
        # VERIFY ASSIGNED AGENT
        # ----------------------------------------------------

        if ticket.assigned_agent_id != agent_id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This ticket is not assigned to you"
            )

        # ----------------------------------------------------
        # GET ALL MESSAGES
        # ----------------------------------------------------

        messages = db.scalars(
            select(TicketMessage)
            .where(
                TicketMessage.ticket_id == ticket_id
            )
            .order_by(
                TicketMessage.created_at.asc()
            )
        ).all()

        return messages

    finally:

        db.close()