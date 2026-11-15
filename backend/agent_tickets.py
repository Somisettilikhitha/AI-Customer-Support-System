from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func

from database import SessionLocal
from models import Ticket
from auth import get_current_agent
from activity_service import create_ticket_activity

from agent_schemas import (
    TicketAssignRequest,
    TicketStatusUpdate,
    TicketPriorityUpdate,
    AgentTicketResponse,
    AgentDashboardResponse
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/agent",
    tags=["Agent"]
)


# ============================================================
# GET ALL TICKETS ASSIGNED TO CURRENT AGENT
# GET /agent/tickets
# ============================================================

@router.get(
    "/tickets",
    response_model=list[AgentTicketResponse]
)
def get_agent_tickets(
    agent_id: int = Depends(get_current_agent)
):
    db = SessionLocal()

    try:
        tickets = db.scalars(
            select(Ticket)
            .where(
                Ticket.assigned_agent_id == agent_id
            )
            .order_by(
                Ticket.created_at.desc()
            )
        ).all()

        return tickets

    finally:
        db.close()


# ============================================================
# GET UNASSIGNED TICKETS
# GET /agent/tickets/unassigned
#
# IMPORTANT:
# This route MUST appear BEFORE /tickets/{ticket_id}
# ============================================================

@router.get(
    "/tickets/unassigned",
    response_model=list[AgentTicketResponse]
)
def get_unassigned_tickets(
    agent_id: int = Depends(get_current_agent)
):
    db = SessionLocal()

    try:
        tickets = db.scalars(
            select(Ticket)
            .where(
                Ticket.assigned_agent_id.is_(None)
            )
            .order_by(
                Ticket.created_at.desc()
            )
        ).all()

        return tickets

    finally:
        db.close()


# ============================================================
# GET ONE ASSIGNED TICKET
# GET /agent/tickets/{ticket_id}
#
# IMPORTANT:
# This comes AFTER /tickets/unassigned
# ============================================================

@router.get(
    "/tickets/{ticket_id}",
    response_model=AgentTicketResponse
)
def get_agent_ticket(
    ticket_id: int,
    agent_id: int = Depends(get_current_agent)
):
    db = SessionLocal()

    try:
        ticket = db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.assigned_agent_id == agent_id
            )
        )

        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or not assigned to you"
            )

        return ticket

    finally:
        db.close()


# ============================================================
# ASSIGN TICKET TO CURRENT AGENT
# PUT /agent/tickets/{ticket_id}/assign
# ============================================================

@router.put(
    "/tickets/{ticket_id}/assign",
    response_model=AgentTicketResponse
)
def assign_ticket_to_self(
    ticket_id: int,
    agent_id: int = Depends(get_current_agent)
):
    db = SessionLocal()

    try:
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
        # Check if already assigned
        # ----------------------------------------------------

        if ticket.assigned_agent_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ticket is already assigned to an agent"
            )

        # ----------------------------------------------------
        # Assign ticket to current agent
        # ----------------------------------------------------

        ticket.assigned_agent_id = agent_id

        # Change status from open → assigned
        if ticket.status == "open":
            ticket.status = "assigned"

        db.commit()
        db.refresh(ticket)

        return ticket

    finally:
        db.close()


# ============================================================
# UPDATE TICKET STATUS
# PUT /agent/tickets/{ticket_id}/status
# ============================================================

@router.put(
    "/tickets/{ticket_id}/status",
    response_model=AgentTicketResponse
)
def update_ticket_status(
    ticket_id: int,
    status_data: TicketStatusUpdate,
    agent_id: int = Depends(get_current_agent)
):
    db = SessionLocal()

    try:
        # ----------------------------------------------------
        # Find ticket assigned to current agent
        # ----------------------------------------------------

        ticket = db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.assigned_agent_id == agent_id
            )
        )

        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or not assigned to you"
            )

        # ----------------------------------------------------
        # Allowed statuses
        # ----------------------------------------------------

        allowed_statuses = {
            "assigned",
            "in_progress",
            "resolved",
            "closed"
        }

        new_status = status_data.status.lower()

        if new_status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid status. Allowed values: "
                    "assigned, in_progress, resolved, closed"
                )
            )
        # ----------------------------------------------------
        # Save old status
        # ----------------------------------------------------

        old_status = ticket.status

        # ----------------------------------------------------
        # Update status
        # ----------------------------------------------------

        ticket.status = new_status

        # ----------------------------------------------------
        # Create activity record
        # ----------------------------------------------------

        if old_status != new_status:

            create_ticket_activity(
                db=db,
                ticket_id=ticket.id,
                user_id=agent_id,
                action="status_changed",
                old_value=old_status,
                new_value=new_status,
                description=(
                    f"Ticket status changed from "
                    f"{old_status} to {new_status}"
                )
            )
 
        # ----------------------------------------------------
        # Save everything
        # ----------------------------------------------------

        db.commit()
        db.refresh(ticket)

        return ticket

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()

# -----------------------------------------------------------
# UPDATE TICKET PRIORITY
# -----------------------------------------------------------

@router.put(
    "/tickets/{ticket_id}/priority",
    response_model=AgentTicketResponse
)
def update_ticket_priority(
    ticket_id: int,
    request: TicketPriorityUpdate,
    agent_id: int = Depends(get_current_agent)
):
    db = SessionLocal()

    try:
        ticket = db.scalar(
            select(Ticket).where(
                Ticket.id == ticket_id,
                Ticket.assigned_agent_id == agent_id
            )
        )

        if ticket is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or not assigned to you"
            )

        allowed_priorities = {"Low", "Medium", "High"}

        if request.priority not in allowed_priorities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Priority must be Low, Medium, or High"
            )

        old_priority = ticket.priority
        new_priority = request.priority

        if old_priority == new_priority:
            return ticket

        ticket.priority = new_priority

        create_ticket_activity(
            db=db,
            ticket_id=ticket.id,
            user_id=agent_id,
            action="priority_changed",
            old_value=old_priority,
            new_value=new_priority,
            description=(
                f"Ticket priority changed from "
                f"{old_priority} to {new_priority}"
            )
        )

        db.commit()
        db.refresh(ticket)

        return ticket

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()

# ============================================================
# AGENT DASHBOARD
# GET /agent/dashboard
# ============================================================

@router.get(
    "/dashboard",
    response_model=AgentDashboardResponse
)
def get_agent_dashboard(
    agent_id: int = Depends(get_current_agent)
):
    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # Total assigned tickets
        # ----------------------------------------------------

        total_tickets = db.scalar(
            select(
                func.count(Ticket.id)
            ).where(
                Ticket.assigned_agent_id == agent_id
            )
        )

        # ----------------------------------------------------
        # Open tickets
        # ----------------------------------------------------

        open_tickets = db.scalar(
            select(
                func.count(Ticket.id)
            ).where(
                Ticket.assigned_agent_id == agent_id,
                Ticket.status == "open"
            )
        )

        # ----------------------------------------------------
        # Assigned tickets
        # ----------------------------------------------------

        assigned_tickets = db.scalar(
            select(
                func.count(Ticket.id)
            ).where(
                Ticket.assigned_agent_id == agent_id,
                Ticket.status == "assigned"
            )
        )

        # ----------------------------------------------------
        # In-progress tickets
        # ----------------------------------------------------

        in_progress_tickets = db.scalar(
            select(
                func.count(Ticket.id)
            ).where(
                Ticket.assigned_agent_id == agent_id,
                Ticket.status == "in_progress"
            )
        )

        # ----------------------------------------------------
        # Resolved tickets
        # ----------------------------------------------------

        resolved_tickets = db.scalar(
            select(
                func.count(Ticket.id)
            ).where(
                Ticket.assigned_agent_id == agent_id,
                Ticket.status == "resolved"
            )
        )

        # ----------------------------------------------------
        # Closed tickets
        # ----------------------------------------------------

        closed_tickets = db.scalar(
            select(
                func.count(Ticket.id)
            ).where(
                Ticket.assigned_agent_id == agent_id,
                Ticket.status == "closed"
            )
        )

        # ----------------------------------------------------
        # High priority tickets
        # ----------------------------------------------------

        high_priority_tickets = db.scalar(
            select(
                func.count(Ticket.id)
            ).where(
                Ticket.assigned_agent_id == agent_id,
                Ticket.priority == "High"
            )
        )

        # ----------------------------------------------------
        # Return dashboard
        # ----------------------------------------------------

        return {
            "total_tickets": total_tickets or 0,
            "open_tickets": open_tickets or 0,
            "assigned_tickets": assigned_tickets or 0,
            "in_progress_tickets": in_progress_tickets or 0,
            "resolved_tickets": resolved_tickets or 0,
            "closed_tickets": closed_tickets or 0,
            "high_priority_tickets": high_priority_tickets or 0
        }

    finally:
        db.close()