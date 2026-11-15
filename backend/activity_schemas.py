from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ============================================================
# TICKET ACTIVITY RESPONSE
# ============================================================

class TicketActivityResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int | None
    action: str
    old_value: str | None
    new_value: str | None
    description: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )