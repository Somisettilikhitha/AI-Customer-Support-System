from pydantic import BaseModel, Field


# ============================================================
# ASSIGN TICKET REQUEST
# ============================================================

class TicketAssignRequest(BaseModel):

    agent_id: int = Field(
        ...,
        description="ID of the support agent to assign the ticket to"
    )


# ============================================================
# AGENT RESPONSE
# ============================================================

class AgentResponse(BaseModel):

    id: int
    name: str
    email: str
    role: str


# ============================================================
# AGENT WORKLOAD RESPONSE
# ============================================================

class AgentWorkloadResponse(BaseModel):

    id: int
    name: str
    email: str

    assigned_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int


# ============================================================
# ADMIN DASHBOARD RESPONSE
# ============================================================

class AdminDashboardResponse(BaseModel):

    total_users: int
    total_customers: int
    total_agents: int

    total_tickets: int

    open_tickets: int
    assigned_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int

    high_priority_tickets: int


# ============================================================
# TICKET STATUS UPDATE REQUEST
# ============================================================

class TicketStatusUpdateRequest(BaseModel):

    status: str = Field(
        ...,
        description="New ticket status"
    )


# ============================================================
# TICKET PRIORITY UPDATE REQUEST
# ============================================================

class TicketPriorityUpdateRequest(BaseModel):

    priority: str = Field(
        ...,
        description="New ticket priority: low, medium, high, urgent"
    )