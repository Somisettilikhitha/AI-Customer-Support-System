from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func

from auth import get_current_admin
from activity_service import create_ticket_activity

from database import SessionLocal
from models import Ticket, User, TicketActivity

from ticket_schemas import TicketResponse

from activity_schemas import TicketActivityResponse
from notification_service import create_notification

from admin_schemas import (
    TicketAssignRequest,
    AgentResponse,
    AgentWorkloadResponse,
    AdminDashboardResponse,
    TicketStatusUpdateRequest,
    TicketPriorityUpdateRequest
)


# ============================================================
# ADMIN ROUTER
# ============================================================

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# ============================================================
# GET ALL TICKETS
# GET /admin/tickets
# ============================================================

@router.get(
    "/tickets",
    response_model=list[TicketResponse]
)
def get_all_tickets(
    admin_id: int = Depends(get_current_admin)
):

    db = SessionLocal()

    try:

        tickets = db.scalars(
            select(Ticket)
            .order_by(
                Ticket.created_at.desc()
            )
        ).all()

        return tickets

    finally:

        db.close()
# ============================================================
# GET UNASSIGNED TICKETS COUNT
# GET /admin/tickets/unassigned/count
# ============================================================

@router.get("/tickets/unassigned/count")
def get_unassigned_tickets_count(
    admin_id: int = Depends(get_current_admin)
):

    db = SessionLocal()

    try:
        unassigned_count = db.scalar(
            select(func.count())
            .select_from(Ticket)
            .where(Ticket.assigned_agent_id.is_(None))
        )

        return {
            "unassigned_tickets": unassigned_count or 0
        }

    finally:
        db.close()

# ============================================================
# ASSIGN / REASSIGN TICKET
# PUT /admin/tickets/{ticket_id}/assign
# ============================================================

@router.put(
    "/tickets/{ticket_id}/assign",
    response_model=TicketResponse
)
def assign_ticket(
    ticket_id: int,
    assign_data: TicketAssignRequest,
    admin_id: int = Depends(get_current_admin)
):

    db = SessionLocal()

    try:

        # ====================================================
        # FIND TICKET
        # ====================================================

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

        # ====================================================
        # FIND AGENT
        # ====================================================

        agent = db.scalar(
            select(User).where(
                User.id == assign_data.agent_id
            )
        )

        if agent is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found"
            )

        # ====================================================
        # VERIFY USER IS AN AGENT
        # ====================================================

        if agent.role != "agent":

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected user is not an agent"
            )

        # ====================================================
        # SAVE OLD VALUES
        # ====================================================

        old_agent_id = ticket.assigned_agent_id
        old_status = ticket.status

        # ====================================================
        # ASSIGN TICKET
        # ====================================================

        ticket.assigned_agent_id = agent.id

        # ====================================================
        # UPDATE STATUS
        # ====================================================

        if ticket.status == "open":
            ticket.status = "assigned"

        # ====================================================
        # CREATE ASSIGNMENT ACTIVITY
        # ====================================================

        create_ticket_activity(
            db=db,
            ticket_id=ticket.id,
            user_id=admin_id,
            action="ticket_assigned",
            old_value=(
                str(old_agent_id)
                if old_agent_id is not None
                else None
            ),
            new_value=str(agent.id),
            description=(
                f"Ticket assigned to Agent {agent.id}"
            )
        )

        # ====================================================
        # CREATE STATUS ACTIVITY
        # ====================================================

        if old_status != ticket.status:

            create_ticket_activity(
                db=db,
                ticket_id=ticket.id,
                user_id=admin_id,
                action="status_changed",
                old_value=old_status,
                new_value=ticket.status,
                description=(
                    f"Ticket status changed from "
                    f"{old_status} to {ticket.status}"
                )
            )
            # ====================================================
            # CREATE AGENT NOTIFICATION
            # ====================================================

            if old_agent_id != agent.id:

                create_notification(
                    db=db,
                    user_id=agent.id,
                    ticket_id=ticket.id,
                    notification_type="ticket_assigned",
                    title="New Ticket Assigned",
                    message=(
                        f"You have been assigned Ticket "
                        f"#{ticket.id}: {ticket.title}"
                    )
                )

        # ====================================================
        # COMMIT EVERYTHING TOGETHER
        # ====================================================

        db.commit()

        db.refresh(ticket)

        return ticket
        # ====================================================
        # COMMIT EVERYTHING TOGETHER
        # ====================================================

        db.commit()

        db.refresh(ticket)

        return ticket

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


# ============================================================
# GET ALL AGENTS
# GET /admin/agents
# ============================================================

@router.get(
    "/agents",
    response_model=list[AgentResponse]
)
def get_all_agents(
    admin_id: int = Depends(get_current_admin)
):

    db = SessionLocal()

    try:

        agents = db.scalars(
            select(User).where(
                User.role == "agent"
            ).order_by(
                User.id.asc()
            )
        ).all()

        return agents

    finally:

        db.close()


# ============================================================
# GET AGENT WORKLOAD
# GET /admin/agents/workload
# ============================================================

@router.get(
    "/agents/workload",
    response_model=list[AgentWorkloadResponse]
)
def get_agent_workload(
    admin_id: int = Depends(get_current_admin)
):

    db = SessionLocal()

    try:

        agents = db.scalars(
            select(User).where(
                User.role == "agent"
            ).order_by(
                User.id.asc()
            )
        ).all()

        results = []

        for agent in agents:

            assigned_tickets = db.scalars(
                select(Ticket).where(
                    Ticket.assigned_agent_id == agent.id
                )
            ).all()

            open_tickets = sum(
                1
                for ticket in assigned_tickets
                if ticket.status == "open"
            )

            in_progress_tickets = sum(
                1
                for ticket in assigned_tickets
                if ticket.status == "in_progress"
            )

            resolved_tickets = sum(
                1
                for ticket in assigned_tickets
                if ticket.status == "resolved"
            )

            closed_tickets = sum(
                1
                for ticket in assigned_tickets
                if ticket.status == "closed"
            )

            results.append(
                AgentWorkloadResponse(
                    id=agent.id,
                    name=agent.name,
                    email=agent.email,
                    assigned_tickets=len(
                        assigned_tickets
                    ),
                    open_tickets=open_tickets,
                    in_progress_tickets=in_progress_tickets,
                    resolved_tickets=resolved_tickets,
                    closed_tickets=closed_tickets
                )
            )

        return results

    finally:

        db.close()


# ============================================================
# ADMIN DASHBOARD
# GET /admin/dashboard
# ============================================================

@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse
)
def get_admin_dashboard(
    admin_id: int = Depends(get_current_admin)
):

    db = SessionLocal()

    try:

        users = db.scalars(
            select(User)
        ).all()

        total_users = len(users)

        total_customers = sum(
            1
            for user in users
            if user.role == "customer"
        )

        total_agents = sum(
            1
            for user in users
            if user.role == "agent"
        )

        tickets = db.scalars(
            select(Ticket)
        ).all()

        total_tickets = len(tickets)

        open_tickets = sum(
            1
            for ticket in tickets
            if ticket.status == "open"
        )

        assigned_tickets = sum(
            1
            for ticket in tickets
            if ticket.status == "assigned"
        )

        in_progress_tickets = sum(
            1
            for ticket in tickets
            if ticket.status == "in_progress"
        )

        resolved_tickets = sum(
            1
            for ticket in tickets
            if ticket.status == "resolved"
        )

        closed_tickets = sum(
            1
            for ticket in tickets
            if ticket.status == "closed"
        )

        high_priority_tickets = sum(
            1
            for ticket in tickets
            if ticket.priority.lower() == "high"
        )

        return AdminDashboardResponse(
            total_users=total_users,
            total_customers=total_customers,
            total_agents=total_agents,
            total_tickets=total_tickets,
            open_tickets=open_tickets,
            assigned_tickets=assigned_tickets,
            in_progress_tickets=in_progress_tickets,
            resolved_tickets=resolved_tickets,
            closed_tickets=closed_tickets,
            high_priority_tickets=high_priority_tickets
        )

    finally:

        db.close()


# ============================================================
# UPDATE TICKET STATUS
# PUT /admin/tickets/{ticket_id}/status
# ============================================================

@router.put(
    "/tickets/{ticket_id}/status",
    response_model=TicketResponse
)
def update_ticket_status(
    ticket_id: int,
    status_data: TicketStatusUpdateRequest,
    admin_id: int = Depends(get_current_admin)
):

    db = SessionLocal()

    try:

        # ====================================================
        # FIND TICKET
        # ====================================================

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

        # ====================================================
        # VALIDATE STATUS
        # ====================================================

        allowed_statuses = {
            "open",
            "assigned",
            "in_progress",
            "resolved",
            "closed"
        }

        new_status = status_data.status.strip().lower()

        if new_status not in allowed_statuses:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid status. Allowed values: "
                    "open, assigned, in_progress, resolved, closed"
                )
            )

        # ====================================================
        # SAVE OLD STATUS
        # ====================================================

        old_status = ticket.status

        # ====================================================
        # UPDATE STATUS
        # ====================================================

        ticket.status = new_status

        # ====================================================
        # CREATE STATUS ACTIVITY AND CUSTOMER NOTIFICATION
        # ====================================================

        if old_status != new_status:

            create_ticket_activity(
                db=db,
                ticket_id=ticket.id,
                user_id=admin_id,
                action="status_changed",
                old_value=old_status,
                new_value=new_status,
                description=(
                    f"Ticket status changed from "
                    f"{old_status} to {new_status}"
                )
            )

            # CREATE CUSTOMER NOTIFICATION
            create_notification(
                db=db,
                user_id=ticket.user_id,
                ticket_id=ticket.id,
                notification_type="ticket_status_changed",
                title="Ticket Status Updated",
                message=(
                    f"Your ticket #{ticket.id} status changed "
                    f"from {old_status} to {new_status}."
                )
            )


        # ====================================================
        # COMMIT
        # ====================================================

        db.commit()

        db.refresh(ticket)

        return ticket

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()

# ============================================================
# GET TICKET ACTIVITY HISTORY
# GET /admin/tickets/{ticket_id}/activities
# ============================================================

@router.get(
    "/tickets/{ticket_id}/activities",
    response_model=list[TicketActivityResponse]
)
def get_ticket_activities(
    ticket_id: int,
    admin_id: int = Depends(get_current_admin)
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
        # GET ACTIVITIES
        # ----------------------------------------------------

        activities = db.scalars(
            select(TicketActivity)
            .where(
                TicketActivity.ticket_id == ticket_id
            )
            .order_by(
                TicketActivity.created_at.asc()
            )
        ).all()

        return activities

    finally:

        db.close()

# ============================================================
# UPDATE TICKET PRIORITY
# PUT /admin/tickets/{ticket_id}/priority
# ============================================================

@router.put(
    "/tickets/{ticket_id}/priority",
    response_model=TicketResponse
)
def update_ticket_priority(
    ticket_id: int,
    priority_data: TicketPriorityUpdateRequest,
    admin_id: int = Depends(get_current_admin)
):

    db = SessionLocal()

    try:

        # FIND TICKET

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

        # VALIDATE PRIORITY

        allowed_priorities = {
            "low",
            "medium",
            "high",
            "urgent"
        }

        new_priority = priority_data.priority.strip().lower()

        if new_priority not in allowed_priorities:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid priority. Allowed values: "
                    "low, medium, high, urgent"
                )
            )

        # SAVE OLD PRIORITY

        old_priority = ticket.priority

        # UPDATE PRIORITY

        if old_priority != new_priority:

            ticket.priority = new_priority

            # CREATE ACTIVITY HISTORY

            create_ticket_activity(
                db=db,
                ticket_id=ticket.id,
                user_id=admin_id,
                action="priority_changed",
                old_value=old_priority,
                new_value=new_priority,
                description=(
                    f"Ticket priority changed from "
                    f"{old_priority} to {new_priority}"
                )
            )

        # COMMIT

        db.commit()

        db.refresh(ticket)

        return ticket

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()