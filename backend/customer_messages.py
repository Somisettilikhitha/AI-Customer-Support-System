from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy import select

from database import SessionLocal

from models import (
    Ticket,
    TicketMessage
)

from auth import get_current_user

from message_schemas import (
    MessageCreate,
    MessageResponse
)

# ============================================================
# EXISTING RAG AI SERVICE
# ============================================================

from rag_service import generate_answer
from notification_service import create_notification

# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/tickets",
    tags=["Customer Messages"]
)


# ============================================================
# CUSTOMER MESSAGE + AI RESPONSE
#
# POST /tickets/{ticket_id}/messages
# ============================================================

@router.post(
    "/{ticket_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED
)
def customer_reply(
    ticket_id: int,
    message_data: MessageCreate,
    user_id: int = Depends(get_current_user)
):

    # ========================================================
    # CREATE DATABASE SESSION
    # ========================================================

    db = SessionLocal()

    try:

        # ====================================================
        # STEP 1: FIND CUSTOMER'S TICKET
        # ====================================================

        ticket = db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.user_id == user_id
            )
        )

        # Ticket doesn't exist or doesn't belong
        # to the logged-in customer.

        if ticket is None:

            raise HTTPException(
                status_code=404,
                detail="Ticket not found"
            )

        # ====================================================
        # STEP 2: VALIDATE CUSTOMER MESSAGE
        # ====================================================

        message_text = message_data.message.strip()

        if not message_text:

            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )

        # ====================================================
        # STEP 3: CREATE CUSTOMER MESSAGE
        # ====================================================

        customer_message = TicketMessage(
            # Ticket this message belongs to
            ticket_id=ticket_id,

            # Logged-in customer's user ID
            sender_id=user_id,

            # Identify the sender
            sender_role="customer",

            # Actual customer message
            message=message_text
        )

        db.add(customer_message)

        # Capture the currently assigned agent
        assigned_agent_id = ticket.assigned_agent_id

        # Create notification for assigned agent
        if assigned_agent_id is not None:

            create_notification(
                db=db,
                user_id=assigned_agent_id,
                ticket_id=ticket.id,
                notification_type="customer_message",
                title="New Customer Message",
                message=(
                    f"Customer sent a new message on "
                    f"Ticket #{ticket.id}: {ticket.title}"
                )
            )

        # ====================================================
        # STEP 4: REOPEN RESOLVED/CLOSED TICKET
        # ====================================================

        if ticket.status in [
            "resolved",
            "closed"
        ]:

            ticket.status = "open"
            ticket.assigned_agent_id = None

        # ====================================================
        # STEP 5: SAVE CUSTOMER MESSAGE
        # ====================================================

        db.commit()

        # Refresh so all database-generated values are available.
        db.refresh(customer_message)

        # ====================================================
        # STEP 6: GENERATE AI RESPONSE
        # ====================================================

        try:

            rag_result = generate_answer(
                message_text
            )

            # Get generated answer
            ai_answer = rag_result.get(
                "answer"
            )

            # Fallback if no answer is returned
            if not ai_answer:

                ai_answer = (
                    "Thank you for your message. "
                    "I don't have enough information "
                    "to answer that question. "
                    "A support agent will review "
                    "your request shortly."
                )

        except Exception as ai_error:

            # The customer's message is already saved.
            # The request should not fail just because
            # the AI/RAG service failed.

            print(
                "\n=========================================="
            )

            print(
                "AI RESPONSE ERROR"
            )

            print(
                f"Error: {ai_error}"
            )

            import traceback

            traceback.print_exc()

            print(
                "Using fallback AI response."
            )

            print(
                "=========================================="
            )

            ai_answer = (
                "Thank you for your message. "
                "I couldn't generate an AI response "
                "right now. A support agent will "
                "review your request shortly."
            )

        # ====================================================
        # STEP 7: CREATE AI MESSAGE
        # ====================================================

        ai_message = TicketMessage(
            # Same ticket
            ticket_id=ticket_id,

            # AI does not have a users.id
            sender_id=None,

            # Identify this as an AI message
            sender_role="ai",

            # Generated AI response
            message=ai_answer
        )

        db.add(ai_message)

        # ====================================================
        # STEP 8: SAVE AI MESSAGE
        # ====================================================

        db.commit()

        db.refresh(ai_message)

        # ====================================================
        # STEP 9: CREATE RESPONSE WHILE SESSION IS ACTIVE
        # ====================================================
        #
        # IMPORTANT:
        # We convert the SQLAlchemy object to the
        # Pydantic response BEFORE closing the database
        # session.
        #
        # This prevents DetachedInstanceError.
        # ====================================================

        response = MessageResponse.model_validate(
            customer_message
        )

        return response

    finally:

        # ====================================================
        # CLOSE DATABASE SESSION
        # ====================================================

        db.close()


# ============================================================
# GET CUSTOMER MESSAGES
#
# GET /tickets/{ticket_id}/messages
# ============================================================

@router.get(
    "/{ticket_id}/messages",
    response_model=list[MessageResponse]
)
def get_customer_messages(
    ticket_id: int,
    user_id: int = Depends(get_current_user)
):

    # ========================================================
    # CREATE DATABASE SESSION
    # ========================================================

    db = SessionLocal()

    try:

        # ====================================================
        # STEP 1: VERIFY CUSTOMER OWNS TICKET
        # ====================================================

        ticket = db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.user_id == user_id
            )
        )

        if ticket is None:

            raise HTTPException(
                status_code=404,
                detail="Ticket not found"
            )

        # ====================================================
        # STEP 2: GET ALL MESSAGES
        # ====================================================

        messages = db.scalars(
            select(TicketMessage)
            .where(
                TicketMessage.ticket_id == ticket_id
            )
            .order_by(
                TicketMessage.created_at.asc()
            )
        ).all()

        # ====================================================
        # STEP 3: CONVERT WHILE SESSION IS ACTIVE
        # ====================================================
        #
        # This also prevents DetachedInstanceError when
        # FastAPI serializes the response after db.close().
        # ====================================================

        response = [
            MessageResponse.model_validate(message)
            for message in messages
        ]

        return response

    finally:

        # ====================================================
        # CLOSE DATABASE SESSION
        # ====================================================

        db.close()