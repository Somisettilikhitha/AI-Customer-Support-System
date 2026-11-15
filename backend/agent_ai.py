from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select

from database import SessionLocal
from models import Ticket
from auth import get_current_agent

from ai_analysis_service import (
    analyze_ticket,
    DEFAULT_RESPONSE
)


# ============================================================
# RESPONSE SCHEMA
# ============================================================

class AgentAIAssistanceResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    ticket_id: int

    title: str

    category: str

    priority: str

    sentiment: str

    ai_confidence: Optional[float] = None

    rag_confidence: Optional[float] = None

    suggested_response: str

    ai_available: bool

    fallback_used: bool


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/agent",
    tags=["Agent AI Assistance"]
)


# ============================================================
# AGENT AI ASSISTANCE
#
# POST /agent/tickets/{ticket_id}/ai-assist
# ============================================================

@router.post(
    "/tickets/{ticket_id}/ai-assist",
    response_model=AgentAIAssistanceResponse,
    status_code=status.HTTP_200_OK
)
def agent_ai_assistance(
    ticket_id: int,
    agent_id: int = Depends(get_current_agent)
):

    db = SessionLocal()

    try:

        # ====================================================
        # STEP 1 — FIND TICKET
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
        # STEP 2 — VERIFY ASSIGNED AGENT
        # ====================================================

        if ticket.assigned_agent_id != agent_id:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "This ticket is not assigned "
                    "to you"
                )
            )

        # ====================================================
        # STEP 3 — RUN AI ANALYSIS
        # ====================================================

        print(
            "\n============================================"
        )

        print(
            f"STARTING AGENT AI ASSISTANCE "
            f"FOR TICKET {ticket.id}"
        )

        print(
            "============================================"
        )

        ai_result = analyze_ticket(
            ticket.title,
            ticket.description
        )

        print(
            "\nAgent AI analysis successful:"
        )

        print(
            ai_result
        )

        # ====================================================
        # STEP 4 — GET AI RESPONSE
        # ====================================================

        suggested_response = ai_result.get(
            "ai_response"
        )

        if not suggested_response:

            suggested_response = DEFAULT_RESPONSE

        # ====================================================
        # STEP 5 — GET AI STATUS
        # ====================================================

        ai_available = ai_result.get(
            "ai_available",
            False
        )

        fallback_used = ai_result.get(
            "fallback_used",
            True
        )

        # ====================================================
        # STEP 6 — RETURN AI ASSISTANCE
        # ====================================================

        return AgentAIAssistanceResponse(

            ticket_id=ticket.id,

            title=ticket.title,

            category=ai_result.get(
                "category",
                "General"
            ),

            priority=ai_result.get(
                "priority",
                "Medium"
            ),

            sentiment=ai_result.get(
                "sentiment",
                "Neutral"
            ),

            ai_confidence=ai_result.get(
                "confidence",
                0.0
            ),

            rag_confidence=ai_result.get(
                "rag_confidence",
                0.0
            ),

            suggested_response=suggested_response,

            ai_available=ai_available,

            fallback_used=fallback_used
        )

    except HTTPException:

        raise

    except Exception as error:

        print(
            "\n========= AGENT AI ASSISTANCE ERROR ========="
        )

        print(
            f"Error: {error}"
        )

        import traceback

        traceback.print_exc()

        print(
            "=============================================="
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate AI assistance"
        )

    finally:

        db.close()