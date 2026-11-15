from ai_service import (
    classify_ticket,
    validate_classification_result
)

from rag_service import generate_answer


# ============================================================
# FALLBACK VALUES
# ============================================================

DEFAULT_CATEGORY = "General"

DEFAULT_PRIORITY = "Medium"

DEFAULT_SENTIMENT = "Neutral"

DEFAULT_CONFIDENCE = 0.0

DEFAULT_RAG_CONFIDENCE = 0.0

DEFAULT_RESPONSE = (
    "Thank you for contacting customer support. "
    "We have received your request and a support agent "
    "will review it shortly."
)


# ============================================================
# AI ANALYSIS SERVICE
# ============================================================

def analyze_ticket(
    title: str,
    description: str
) -> dict:
    """
    Perform complete AI analysis for a customer support ticket.

    Includes:

    1. AI category classification
    2. AI priority prediction
    3. AI sentiment analysis
    4. AI confidence calculation
    5. RAG-generated response
    6. Error and fallback handling
    """

    # ========================================================
    # VALIDATE INPUT
    # ========================================================

    if title is None:
        title = ""

    if description is None:
        description = ""

    title = title.strip()

    description = description.strip()

    # --------------------------------------------------------
    # INVALID INPUT
    # --------------------------------------------------------

    if not title:

        raise ValueError(
            "Ticket title cannot be empty"
        )

    if not description:

        raise ValueError(
            "Ticket description cannot be empty"
        )

    # ========================================================
    # DEFAULT RESULT
    # ========================================================

    classification_result = {
        "category": DEFAULT_CATEGORY,
        "priority": DEFAULT_PRIORITY,
        "sentiment": DEFAULT_SENTIMENT,
        "confidence": DEFAULT_CONFIDENCE
    }

    ai_response = DEFAULT_RESPONSE

    rag_confidence = DEFAULT_RAG_CONFIDENCE

    classification_available = False

    rag_available = False

    # ========================================================
    # AI CLASSIFICATION
    # ========================================================

    try:

        raw_classification_result = classify_ticket(
            title,
            description
        )

        # ----------------------------------------------------
        # VALIDATE CLASSIFICATION RESULT
        # ----------------------------------------------------

        classification_result = (
            validate_classification_result(
                raw_classification_result
            )
        )

        # ----------------------------------------------------
        # ENSURE REQUIRED VALUES EXIST
        # ----------------------------------------------------

        classification_result.setdefault(
            "category",
            DEFAULT_CATEGORY
        )

        classification_result.setdefault(
            "priority",
            DEFAULT_PRIORITY
        )

        classification_result.setdefault(
            "sentiment",
            DEFAULT_SENTIMENT
        )

        classification_result.setdefault(
            "confidence",
            DEFAULT_CONFIDENCE
        )

        classification_available = True

        print(
            "\nAI classification successful:"
        )

        print(
            classification_result
        )

    except Exception as error:

        print(
            "\n=========== AI CLASSIFICATION ERROR ==========="
        )

        print(
            f"Error: {error}"
        )

        import traceback

        traceback.print_exc()

        print(
            "Using classification fallback."
        )

        print(
            "==============================================="
        )

        classification_result = {
            "category": DEFAULT_CATEGORY,
            "priority": DEFAULT_PRIORITY,
            "sentiment": DEFAULT_SENTIMENT,
            "confidence": DEFAULT_CONFIDENCE
        }

    # ========================================================
    # RAG RESPONSE
    # ========================================================

    try:

        rag_result = generate_answer(
            description
        )

        # ----------------------------------------------------
        # VALIDATE RAG RESULT
        # ----------------------------------------------------

        if not isinstance(
            rag_result,
            dict
        ):

            raise ValueError(
                "RAG service returned invalid result"
            )

        # ----------------------------------------------------
        # EXTRACT ANSWER
        # ----------------------------------------------------

        ai_response = rag_result.get(
            "answer"
        )

        # ----------------------------------------------------
        # EXTRACT CONFIDENCE
        # ----------------------------------------------------

        rag_confidence = rag_result.get(
            "confidence",
            DEFAULT_RAG_CONFIDENCE
        )

        # ----------------------------------------------------
        # SAFE RESPONSE
        # ----------------------------------------------------

        if not ai_response:

            ai_response = DEFAULT_RESPONSE

        # ----------------------------------------------------
        # SAFE CONFIDENCE
        # ----------------------------------------------------

        try:

            rag_confidence = float(
                rag_confidence
            )

        except (
            TypeError,
            ValueError
        ):

            rag_confidence = (
                DEFAULT_RAG_CONFIDENCE
            )

        # ----------------------------------------------------
        # LIMIT CONFIDENCE
        # ----------------------------------------------------

        if rag_confidence < 0:

            rag_confidence = (
                DEFAULT_RAG_CONFIDENCE
            )

        if rag_confidence > 1:

            rag_confidence = 1.0

        rag_available = True

        print(
            "\nRAG generation successful."
        )

        print(
            f"RAG confidence: "
            f"{rag_confidence}"
        )

    except Exception as error:

        print(
            "\n=============== RAG ERROR ==============="
        )

        print(
            f"Error: {error}"
        )

        import traceback

        traceback.print_exc()

        print(
            "Using RAG fallback."
        )

        print(
            "=========================================="
        )

        ai_response = DEFAULT_RESPONSE

        rag_confidence = (
            DEFAULT_RAG_CONFIDENCE
        )

    # ========================================================
    # AI AVAILABILITY
    # ========================================================

    ai_available = (
        classification_available
        or rag_available
    )

    # ========================================================
    # FALLBACK STATUS
    # ========================================================

    fallback_used = not (
        classification_available
        and rag_available
    )

    # ========================================================
    # FINAL RESULT
    # ========================================================

    result = {

        "category": classification_result[
            "category"
        ],

        "priority": classification_result[
            "priority"
        ],

        "sentiment": classification_result[
            "sentiment"
        ],

        "confidence": classification_result[
            "confidence"
        ],

        "ai_response": ai_response,

        "rag_confidence": rag_confidence,

        "ai_available": ai_available,

        "fallback_used": fallback_used
    }

    # ========================================================
    # DISPLAY RESULT
    # ========================================================

    print(
        "\n============================================"
    )

    print(
        "FINAL AI ANALYSIS RESULT"
    )

    print(
        "============================================"
    )

    print(
        f"Category: {result['category']}"
    )

    print(
        f"Priority: {result['priority']}"
    )

    print(
        f"Sentiment: {result['sentiment']}"
    )

    print(
        f"AI Confidence: {result['confidence']}"
    )

    print(
        f"RAG Confidence: {result['rag_confidence']}"
    )

    print(
        f"AI Available: {result['ai_available']}"
    )

    print(
        f"Fallback Used: {result['fallback_used']}"
    )

    print(
        f"AI Response: {result['ai_response']}"
    )

    print(
        "============================================"
    )

    return result


# ============================================================
# TEST AI ANALYSIS SERVICE
# ============================================================

if __name__ == "__main__":

    print("\n")

    print("=" * 70)

    print(
        "AI ANALYSIS SERVICE TEST"
    )

    print("=" * 70)

    # --------------------------------------------------------
    # TEST TICKET
    # --------------------------------------------------------

    title = "Payment failed"

    description = (
        "My payment was declined while trying "
        "to place an order."
    )

    print("\nTicket:")

    print("-------------------------")

    print(
        f"Title: {title}"
    )

    print(
        f"Description: {description}"
    )

    # --------------------------------------------------------
    # RUN ANALYSIS
    # --------------------------------------------------------

    result = analyze_ticket(
        title,
        description
    )

    # --------------------------------------------------------
    # DISPLAY RESULT
    # --------------------------------------------------------

    print("\n")

    print(
        "AI Analysis Result:"
    )

    print("-------------------------")

    print(
        f"Category: "
        f"{result['category']}"
    )

    print(
        f"Priority: "
        f"{result['priority']}"
    )

    print(
        f"Sentiment: "
        f"{result['sentiment']}"
    )

    print(
        f"AI Confidence: "
        f"{result['confidence']}"
    )

    print(
        f"RAG Confidence: "
        f"{result['rag_confidence']}"
    )

    print(
        f"AI Available: "
        f"{result['ai_available']}"
    )

    print(
        f"Fallback Used: "
        f"{result['fallback_used']}"
    )

    print(
        f"AI Response: "
        f"{result['ai_response']}"
    )

    # --------------------------------------------------------
    # FINAL CHECK
    # --------------------------------------------------------

    required_fields = [
        "category",
        "priority",
        "sentiment",
        "confidence",
        "ai_response",
        "rag_confidence",
        "ai_available",
        "fallback_used"
    ]

    missing_fields = [
        field
        for field in required_fields
        if field not in result
    ]

    if missing_fields:

        print("\n")

        print(
            "❌ AI ANALYSIS TEST FAILED"
        )

        print(
            f"Missing fields: "
            f"{missing_fields}"
        )

    else:

        print("\n")

        print(
            "✅ AI ANALYSIS SERVICE TEST PASSED"
        )

    print("\n")

    print("=" * 70)