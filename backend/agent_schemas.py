from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ============================================================
# ASSIGN TICKET REQUEST
# ============================================================

class TicketAssignRequest(BaseModel):
    agent_id: int


# ============================================================
# UPDATE TICKET STATUS
# ============================================================

class TicketStatusUpdate(BaseModel):
    status: str


# ============================================================
# UPDATE TICKET PRIORITY
# ============================================================

class TicketPriorityUpdate(BaseModel):
    priority: str

    
# ============================================================
# AGENT TICKET RESPONSE
# ============================================================

class AgentTicketResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    title: str
    description: str

    status: str
    priority: str
    category: str
    sentiment: str

    ai_confidence: Optional[float] = None
    ai_response: Optional[str] = None

    user_id: int
    assigned_agent_id: Optional[int] = None

    created_at: datetime
    updated_at: datetime


# ============================================================
# AGENT DASHBOARD RESPONSE
# ============================================================

class AgentDashboardResponse(BaseModel):

    total_tickets: int
    open_tickets: int
    assigned_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int
    high_priority_tickets: int