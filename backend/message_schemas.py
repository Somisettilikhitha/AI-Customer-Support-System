from datetime import datetime

from pydantic import BaseModel


# ============================================================
# CREATE MESSAGE
# ============================================================

class MessageCreate(BaseModel):

    message: str


# ============================================================
# MESSAGE RESPONSE
# ============================================================

class MessageResponse(BaseModel):

    id: int

    ticket_id: int

    # --------------------------------------------------------
    # Customer/agent messages have a user ID.
    #
    # AI messages have:
    #
    # sender_id = None
    #
    # --------------------------------------------------------

    sender_id: int | None

    sender_role: str

    message: str

    created_at: datetime


    # ========================================================
    # SQLAlchemy MODEL SUPPORT
    # ========================================================

    class Config:

        from_attributes = True