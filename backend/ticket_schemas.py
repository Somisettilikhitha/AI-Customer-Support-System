from datetime import datetime

from pydantic import BaseModel, Field


# ============================================================
# CREATE TICKET
# ============================================================

class TicketCreate(BaseModel):

    title: str = Field(
        min_length=3,
        max_length=200
    )

    description: str = Field(
        min_length=5
    )


# ============================================================
# UPDATE TICKET
# ============================================================

class TicketUpdate(BaseModel):

    title: str | None = Field(
        default=None,
        min_length=3,
        max_length=200
    )

    description: str | None = Field(
        default=None,
        min_length=5
    )

    status: str | None = None

    priority: str | None = None

    category: str | None = None


# ============================================================
# TICKET RESPONSE
# ============================================================

class TicketResponse(BaseModel):

    id: int

    title: str

    description: str

    status: str

    priority: str

    category: str

    sentiment: str | None

    ai_confidence: float | None

    ai_response: str | None

    user_id: int

    assigned_agent_id: int | None

    created_at: datetime

    updated_at: datetime


    class Config:

        from_attributes = True