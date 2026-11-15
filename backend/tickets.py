from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_, asc, desc

from database import SessionLocal
from models import Ticket

from ticket_schemas import (
    TicketCreate,
    TicketUpdate,
    TicketResponse
)

from auth import get_current_user

# ============================================================
# PHASE 15.7 / 15.8 / 15.9
# CENTRALIZED AI ANALYSIS SERVICE
# ============================================================

from ai_analysis_service import analyze_ticket


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)


# ============================================================
# CREATE TICKET
# POST /tickets/
# ============================================================

@router.post(
    "/",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK
)
def create_ticket(
    ticket_data: TicketCreate,
    user_id: int = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        print(
            "\n============================================"
        )
        print(
            "STARTING AI TICKET ANALYSIS"
        )
        print(
            "============================================"
        )

        # ----------------------------------------------------
        # CENTRALIZED AI ANALYSIS
        # ----------------------------------------------------

        ai_result = analyze_ticket(
            ticket_data.title,
            ticket_data.description
        )

        print(
            "\nAI analysis successful:"
        )
        print(
            ai_result
        )

        # ----------------------------------------------------
        # EXTRACT AI RESULTS
        # ----------------------------------------------------

        category = ai_result["category"]

        priority = ai_result["priority"]

        sentiment = ai_result["sentiment"]

        ai_confidence = ai_result["confidence"]

        ai_response = ai_result.get(
            "ai_response"
        )

        # ----------------------------------------------------
        # SAFE AI RESPONSE
        # ----------------------------------------------------

        if not ai_response:

            ai_response = (
                "I don't have enough information "
                "to answer that question."
            )

        # ----------------------------------------------------
        # CREATE TICKET
        # ----------------------------------------------------

        ticket = Ticket(
            title=ticket_data.title,
            description=ticket_data.description,

            status="open",

            priority=priority,

            category=category,

            sentiment=sentiment,

            ai_confidence=ai_confidence,

            ai_response=ai_response,

            user_id=user_id,

            assigned_agent_id=None
        )

        # ----------------------------------------------------
        # SAVE
        # ----------------------------------------------------

        db.add(ticket)

        db.commit()

        db.refresh(ticket)

        print(
            "\n============================================"
        )
        print(
            f"Ticket created successfully. "
            f"Ticket ID: {ticket.id}"
        )
        print(
            "============================================"
        )

        return ticket

    except HTTPException:

        db.rollback()

        raise

    except Exception as error:

        db.rollback()

        print(
            "\n=========== TICKET CREATION ERROR ==========="
        )

        print(
            f"Error: {error}"
        )

        import traceback

        traceback.print_exc()

        print(
            "============================================="
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create ticket"
        )

    finally:

        db.close()


# ============================================================
# AI RE-ANALYSIS
# POST /tickets/{ticket_id}/reanalyze
#
# PHASE 15.9
# ============================================================

@router.post(
    "/{ticket_id}/reanalyze",
    response_model=TicketResponse,
    status_code=status.HTTP_200_OK
)
def reanalyze_ticket(
    ticket_id: int,
    user_id: int = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        print(
            "\n============================================"
        )

        print(
            f"STARTING AI RE-ANALYSIS "
            f"FOR TICKET {ticket_id}"
        )

        print(
            "============================================"
        )

        # ----------------------------------------------------
        # FIND CUSTOMER'S TICKET
        # ----------------------------------------------------

        ticket = db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.user_id == user_id
            )
        )

        if ticket is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )

        # ----------------------------------------------------
        # RUN CENTRALIZED AI ANALYSIS
        # ----------------------------------------------------

        ai_result = analyze_ticket(
            ticket.title,
            ticket.description
        )

        print(
            "\nAI re-analysis successful:"
        )

        print(
            ai_result
        )

        # ----------------------------------------------------
        # UPDATE CATEGORY
        # ----------------------------------------------------

        ticket.category = ai_result[
            "category"
        ]

        # ----------------------------------------------------
        # UPDATE PRIORITY
        # ----------------------------------------------------

        ticket.priority = ai_result[
            "priority"
        ]

        # ----------------------------------------------------
        # UPDATE SENTIMENT
        # ----------------------------------------------------

        ticket.sentiment = ai_result[
            "sentiment"
        ]

        # ----------------------------------------------------
        # UPDATE AI CONFIDENCE
        # ----------------------------------------------------

        ticket.ai_confidence = ai_result[
            "confidence"
        ]

        # ----------------------------------------------------
        # UPDATE AI RESPONSE
        # ----------------------------------------------------

        ai_response = ai_result.get(
            "ai_response"
        )

        if not ai_response:

            ai_response = (
                "I don't have enough information "
                "to answer that question."
            )

        ticket.ai_response = ai_response

        # ----------------------------------------------------
        # SAVE
        # ----------------------------------------------------

        db.commit()

        db.refresh(ticket)

        print(
            "\n============================================"
        )

        print(
            f"AI re-analysis completed "
            f"for ticket {ticket.id}"
        )

        print(
            "============================================"
        )

        return ticket

    except HTTPException:

        db.rollback()

        raise

    except Exception as error:

        db.rollback()

        print(
            "\n========= AI RE-ANALYSIS ERROR ========="
        )

        print(
            f"Error: {error}"
        )

        import traceback

        traceback.print_exc()

        print(
            "========================================="
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to re-analyze ticket"
        )

    finally:

        db.close()


# ============================================================
# GET ALL MY TICKETS
# GET /tickets/
# ============================================================

@router.get(
    "/",
    response_model=list[TicketResponse]
)
def get_my_tickets(
    user_id: int = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        tickets = db.scalars(
            select(Ticket)
            .where(
                Ticket.user_id == user_id
            )
            .order_by(
                Ticket.created_at.desc()
            )
        ).all()

        return tickets

    finally:

        db.close()


# ============================================================
# SEARCH, FILTER, SORT AND PAGINATE MY TICKETS
#
# GET /tickets/search
# ============================================================

@router.get(
    "/search",
    response_model=list[TicketResponse]
)
def search_tickets(
    search: str | None = None,
    status_filter: str | None = None,
    priority: str | None = None,
    category: str | None = None,

    sort_by: str = "created_at",
    sort_order: str = "desc",

    page: int = 1,
    page_size: int = 10,

    user_id: int = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # VALIDATE PAGE
        # ----------------------------------------------------

        if page < 1:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Page must be greater than "
                    "or equal to 1"
                )
            )

        # ----------------------------------------------------
        # VALIDATE PAGE SIZE
        # ----------------------------------------------------

        if page_size < 1 or page_size > 100:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Page size must be between "
                    "1 and 100"
                )
            )

        # ----------------------------------------------------
        # ALLOWED SORT FIELDS
        # ----------------------------------------------------

        allowed_sort_fields = {

            "id": Ticket.id,

            "title": Ticket.title,

            "status": Ticket.status,

            "priority": Ticket.priority,

            "category": Ticket.category,

            "created_at": Ticket.created_at,

            "updated_at": Ticket.updated_at
        }

        # ----------------------------------------------------
        # VALIDATE SORT FIELD
        # ----------------------------------------------------

        if sort_by not in allowed_sort_fields:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid sort_by. Allowed values: "
                    "id, title, status, priority, "
                    "category, created_at, updated_at"
                )
            )

        # ----------------------------------------------------
        # VALIDATE SORT ORDER
        # ----------------------------------------------------

        if sort_order.lower() not in [
            "asc",
            "desc"
        ]:

            raise HTTPException(
                status_code=400,
                detail=(
                    "sort_order must be "
                    "'asc' or 'desc'"
                )
            )

        # ----------------------------------------------------
        # BASE QUERY
        # ----------------------------------------------------

        query = select(Ticket).where(
            Ticket.user_id == user_id
        )

        # ----------------------------------------------------
        # SEARCH
        # ----------------------------------------------------

        if search:

            search_value = (
                f"%{search.strip()}%"
            )

            query = query.where(
                or_(
                    Ticket.title.ilike(
                        search_value
                    ),
                    Ticket.description.ilike(
                        search_value
                    )
                )
            )

        # ----------------------------------------------------
        # STATUS FILTER
        # ----------------------------------------------------

        if status_filter:

            query = query.where(
                Ticket.status.ilike(
                    status_filter.strip()
                )
            )

        # ----------------------------------------------------
        # PRIORITY FILTER
        # ----------------------------------------------------

        if priority:

            query = query.where(
                Ticket.priority.ilike(
                    priority.strip()
                )
            )

        # ----------------------------------------------------
        # CATEGORY FILTER
        # ----------------------------------------------------

        if category:

            query = query.where(
                Ticket.category.ilike(
                    category.strip()
                )
            )

        # ----------------------------------------------------
        # SORTING
        # ----------------------------------------------------

        sort_column = allowed_sort_fields[
            sort_by
        ]

        if sort_order.lower() == "asc":

            query = query.order_by(
                asc(sort_column)
            )

        else:

            query = query.order_by(
                desc(sort_column)
            )

        # ----------------------------------------------------
        # PAGINATION
        # ----------------------------------------------------

        offset = (
            (page - 1)
            * page_size
        )

        query = query.offset(
            offset
        ).limit(
            page_size
        )

        # ----------------------------------------------------
        # EXECUTE
        # ----------------------------------------------------

        tickets = db.scalars(
            query
        ).all()

        return tickets

    finally:

        db.close()


# ============================================================
# GET ONE TICKET
# GET /tickets/{ticket_id}
# ============================================================

@router.get(
    "/{ticket_id}",
    response_model=TicketResponse
)
def get_ticket(
    ticket_id: int,
    user_id: int = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        ticket = db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.user_id == user_id
            )
        )

        if ticket is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )

        return ticket

    finally:

        db.close()


# ============================================================
# UPDATE ONE TICKET
# PUT /tickets/{ticket_id}
# ============================================================

@router.put(
    "/{ticket_id}",
    response_model=TicketResponse
)
def update_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    user_id: int = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        ticket = db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.user_id == user_id
            )
        )

        if ticket is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )

        # ----------------------------------------------------
        # UPDATE TITLE
        # ----------------------------------------------------

        if ticket_data.title is not None:

            ticket.title = (
                ticket_data.title
            )

        # ----------------------------------------------------
        # UPDATE DESCRIPTION
        # ----------------------------------------------------

        if ticket_data.description is not None:

            ticket.description = (
                ticket_data.description
            )

        # ----------------------------------------------------
        # UPDATE STATUS
        # ----------------------------------------------------

        if ticket_data.status is not None:

            ticket.status = (
                ticket_data.status
            )

        # ----------------------------------------------------
        # UPDATE PRIORITY
        # ----------------------------------------------------

        if ticket_data.priority is not None:

            ticket.priority = (
                ticket_data.priority
            )

        # ----------------------------------------------------
        # UPDATE CATEGORY
        # ----------------------------------------------------

        if ticket_data.category is not None:

            ticket.category = (
                ticket_data.category
            )

        # ----------------------------------------------------
        # SAVE
        # ----------------------------------------------------

        db.commit()

        db.refresh(ticket)

        return ticket

    finally:

        db.close()


# ============================================================
# DELETE ONE TICKET
# DELETE /tickets/{ticket_id}
# ============================================================

@router.delete(
    "/{ticket_id}",
    status_code=status.HTTP_200_OK
)
def delete_ticket(
    ticket_id: int,
    user_id: int = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # FIND CUSTOMER'S TICKET
        # ----------------------------------------------------

        ticket = db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.user_id == user_id
            )
        )

        if ticket is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )

        # ----------------------------------------------------
        # DELETE
        # ----------------------------------------------------

        db.delete(ticket)

        db.commit()

        return {
            "message": "Ticket deleted successfully",
            "ticket_id": ticket_id
        }

    finally:

        db.close()