from transformers import pipeline


# ============================================================
# LOAD AI MODELS
# ============================================================

print("Loading AI classification models...")


# ------------------------------------------------------------
# Zero-shot classification model
# ------------------------------------------------------------

classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)


# ------------------------------------------------------------
# Sentiment analysis model
# ------------------------------------------------------------

sentiment_classifier = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)


print("AI classification models loaded.")


# ============================================================
# CATEGORY DEFINITIONS
# ============================================================

CATEGORY_DEFINITIONS = {

    "Billing": (
        "a billing or payment question involving "
        "payment methods, invoices, transactions, "
        "billing amounts, card payments, or charges"
    ),

    "Technical": (
        "a technical problem involving software errors, "
        "application crashes, bugs, system failures, "
        "website problems, upload failures, or features "
        "not working"
    ),

    "Account": (
        "an account problem involving login, password, "
        "username, registration, profile, account access, "
        "or account settings"
    ),

    "Delivery": (
        "a delivery or shipping problem involving packages, "
        "tracking, late delivery, missing packages, "
        "shipping addresses, or order arrival"
    ),

    "Refund": (
        "a request for money back, reimbursement, refund, "
        "return of payment, duplicate payment refund, "
        "or cancellation refund"
    ),

    "Product": (
        "a question specifically about a product, "
        "product features, product usage, product "
        "information, or product availability"
    ),

    "General": (
        "a general customer support question that does "
        "not belong to billing, technical, account, "
        "delivery, refund, or product"
    )
}


# ============================================================
# PRIORITY DEFINITIONS
# ============================================================

PRIORITY_DEFINITIONS = {

    "Low": (
        "a simple question, general information request, "
        "minor inconvenience, or issue that does not "
        "significantly affect the customer"
    ),

    "Medium": (
        "a normal customer support issue that needs "
        "attention but does not seriously prevent the "
        "customer from using the service"
    ),

    "High": (
        "a serious issue that significantly affects the "
        "customer, prevents important functionality, "
        "causes financial problems, or requires prompt support"
    ),

    "Critical": (
        "an extremely serious issue such as a major system "
        "outage, security incident, severe financial loss, "
        "or issue affecting many customers"
    )
}


# ============================================================
# KEYWORD HELPER
# ============================================================

def contains_any(text, keywords):

    return any(
        keyword in text
        for keyword in keywords
    )


# ============================================================
# RULE-BASED CATEGORY DETECTION
# ============================================================

def detect_category_by_rules(text):

    text = text.lower()


    # --------------------------------------------------------
    # REFUND
    # --------------------------------------------------------

    refund_keywords = [
        "refund",
        "money back",
        "reimbursement",
        "return my payment",
        "charged twice",
        "duplicate charge",
        "duplicate payment",
        "wrong charge",
        "incorrect charge",
        "charged incorrectly"
    ]

    if contains_any(
        text,
        refund_keywords
    ):
        return "Refund"


    # --------------------------------------------------------
    # BILLING
    # --------------------------------------------------------

    billing_keywords = [
        "payment method",
        "payment methods",
        "pay with",
        "how can i pay",
        "payment option",
        "payment options",
        "credit card",
        "debit card",
        "paypal",
        "invoice",
        "billing",
        "billing amount",
        "transaction",
        "payment"
    ]

    if contains_any(
        text,
        billing_keywords
    ):
        return "Billing"


    # --------------------------------------------------------
    # DELIVERY
    # --------------------------------------------------------

    delivery_keywords = [
        "delivery",
        "shipping",
        "shipment",
        "package",
        "parcel",
        "track my order",
        "track my package",
        "tracking",
        "not arrived",
        "late delivery",
        "missing package",
        "shipping address"
    ]

    if contains_any(
        text,
        delivery_keywords
    ):
        return "Delivery"


    # --------------------------------------------------------
    # ACCOUNT
    # --------------------------------------------------------

    account_keywords = [
        "login",
        "log in",
        "password",
        "forgot password",
        "username",
        "account",
        "sign up",
        "signup",
        "register",
        "registration",
        "profile",
        "profile update",
        "profile information",
        "account settings"
    ]

    if contains_any(
        text,
        account_keywords
    ):
        return "Account"


    # --------------------------------------------------------
    # TECHNICAL
    # --------------------------------------------------------

    technical_keywords = [
        "crash",
        "crashes",
        "error",
        "bug",
        "not working",
        "doesn't work",
        "does not work",
        "application",
        "app",
        "website error",
        "upload failed",
        "upload failure",
        "system failure"
    ]

    if contains_any(
        text,
        technical_keywords
    ):
        return "Technical"


    # --------------------------------------------------------
    # GENERAL INFORMATION
    # --------------------------------------------------------

    general_keywords = [
        "office address",
        "company address",
        "business address",
        "office location",
        "company location",
        "business location",
        "head office",
        "headquarters",
        "contact address",
        "contact information",
        "company information",
        "about the company"
    ]

    if contains_any(
        text,
        general_keywords
    ):
        return "General"


    # --------------------------------------------------------
    # PRODUCT
    # --------------------------------------------------------

    product_keywords = [
        "product feature",
        "product features",
        "product usage",
        "product information",
        "product availability",
        "available product"
    ]

    if contains_any(
        text,
        product_keywords
    ):
        return "Product"


    # --------------------------------------------------------
    # NO CLEAR RULE
    # --------------------------------------------------------

    return None


# ============================================================
# RULE-BASED PRIORITY DETECTION
# ============================================================

def detect_priority_by_rules(text):

    text = text.lower()


    # ========================================================
    # CRITICAL
    #
    # These issues require immediate attention.
    # ========================================================

    critical_keywords = [
        "system outage",
        "service outage",
        "security breach",
        "security incident",
        "all users affected",
        "everyone affected",
        "major outage",
        "data breach",
        "data stolen",
        "severe financial loss"
    ]

    if contains_any(
        text,
        critical_keywords
    ):
        return "Critical"


    # ========================================================
    # HIGH
    #
    # Serious problems that significantly block
    # important functionality or create serious risk.
    # ========================================================

    high_keywords = [
        "charged twice",
        "duplicate charge",
        "money stolen",

        "cannot login",
        "can't login",
        "cannot log in",
        "can't log in",

        "account locked",

        "cannot access account",
        "can't access account",

        "payment failed",
        "payment failure",

        "completely broken",

        "application crashes",
        "app crashes",

        "security problem",
        "unauthorized access"
    ]

    if contains_any(
        text,
        high_keywords
    ):
        return "High"


    # ========================================================
    # MEDIUM
    #
    # Normal functionality problems that need support
    # but are not critical.
    #
    # IMPORTANT:
    # Profile/account update problems are explicitly Medium.
    # This prevents the BART model from incorrectly classifying
    # them as High.
    # ========================================================

    medium_keywords = [

        # General functionality problems
        "not working",
        "doesn't work",
        "does not work",

        "problem",
        "issue",

        "incorrect",
        "wrong information",

        # Save/update problems
        "not being saved",
        "not saved",
        "changes are not saved",
        "changes not saved",

        "unable to update",
        "unable to change",

        "cannot update",
        "can't update",

        "unable to edit",
        "cannot edit",
        "can't edit",

        # Profile problems
        "profile update",
        "profile information",
        "update my profile",
        "updating my profile",

        # Account settings
        "account settings",
        "unable to update account",
        "unable to change account",

        # Other normal support problems
        "late",
        "missing"
    ]

    if contains_any(
        text,
        medium_keywords
    ):
        return "Medium"


    # ========================================================
    # SIMPLE INFORMATION QUESTIONS
    # ========================================================

    question_keywords = [
        "what",
        "how",
        "can i",
        "where",
        "which",
        "do you",
        "does"
    ]

    if contains_any(
        text,
        question_keywords
    ):
        return "Low"


    # ========================================================
    # NO CLEAR RULE
    #
    # Only now do we allow BART to determine the priority.
    # ========================================================

    return None


# ============================================================
# SENTIMENT DETECTION
# ============================================================

def detect_sentiment(text):

    result = sentiment_classifier(
        text
    )[0]

    label = result["label"]
    score = result["score"]


    # --------------------------------------------------------
    # POSITIVE
    # --------------------------------------------------------

    if label == "POSITIVE":

        return "Positive", score


    # --------------------------------------------------------
    # NEGATIVE
    # --------------------------------------------------------

    return "Negative", score


# ============================================================
# CLASSIFY TICKET
# ============================================================

def classify_ticket(
    title: str,
    description: str
):

    ticket_text = (
        f"Customer support ticket.\n"
        f"Title: {title}\n"
        f"Description: {description}"
    )

    text_lower = ticket_text.lower()


    # ========================================================
    # CATEGORY
    # ========================================================

    category = detect_category_by_rules(
        text_lower
    )


    # --------------------------------------------------------
    # If rules don't identify category,
    # use BART.
    # --------------------------------------------------------

    if category is None:

        category_labels = list(
            CATEGORY_DEFINITIONS.values()
        )

        category_result = classifier(
            ticket_text,
            candidate_labels=category_labels,
            multi_label=False
        )

        best_category_definition = (
            category_result["labels"][0]
        )

        category_score = (
            category_result["scores"][0]
        )

        category = next(
            key
            for key, value
            in CATEGORY_DEFINITIONS.items()
            if value == best_category_definition
        )

    else:

        category_score = 0.90


    # ========================================================
    # PRIORITY
    # ========================================================

    priority = detect_priority_by_rules(
        text_lower
    )


    # --------------------------------------------------------
    # If rules don't identify priority,
    # use BART.
    #
    # Profile-update tickets should NOT reach this section
    # because they are explicitly handled as Medium above.
    # --------------------------------------------------------

    if priority is None:

        priority_labels = list(
            PRIORITY_DEFINITIONS.values()
        )

        priority_result = classifier(
            ticket_text,
            candidate_labels=priority_labels,
            multi_label=False
        )

        best_priority_definition = (
            priority_result["labels"][0]
        )

        priority_score = (
            priority_result["scores"][0]
        )

        priority = next(
            key
            for key, value
            in PRIORITY_DEFINITIONS.items()
            if value == best_priority_definition
        )

    else:

        priority_score = 0.90


    # ========================================================
    # SENTIMENT
    # ========================================================

    sentiment, sentiment_score = detect_sentiment(
        ticket_text
    )


    # ========================================================
    # INFORMATIONAL QUESTIONS
    # ========================================================

    informational_phrases = [
        "what payment methods",
        "what payment method",
        "how can i pay",
        "how do i create an account",
        "how can i create an account",
        "where can i track",
        "what is your",
        "how does"
    ]

    if contains_any(
        text_lower,
        informational_phrases
    ):

        sentiment = "Neutral"

        sentiment_score = 0.90


    # ========================================================
    # CONFIDENCE
    # ========================================================

    confidence = (
        category_score
        + priority_score
        + sentiment_score
    ) / 3

    confidence = round(
        confidence,
        4
    )


    # ========================================================
    # RETURN RESULT
    # ========================================================

    return {
        "category": category,
        "priority": priority,
        "sentiment": sentiment,
        "confidence": confidence
    }


# ============================================================
# VALIDATE AI CLASSIFICATION RESULT
# ============================================================

def validate_classification_result(
    result: dict
) -> dict:

    # --------------------------------------------------------
    # ALLOWED VALUES
    # --------------------------------------------------------

    allowed_categories = set(
        CATEGORY_DEFINITIONS.keys()
    )

    allowed_priorities = set(
        PRIORITY_DEFINITIONS.keys()
    )

    allowed_sentiments = {
        "Positive",
        "Negative",
        "Neutral"
    }


    # --------------------------------------------------------
    # SAFETY CHECK
    # --------------------------------------------------------

    if not isinstance(
        result,
        dict
    ):

        result = {}


    # --------------------------------------------------------
    # GET VALUES
    # --------------------------------------------------------

    category = result.get(
        "category"
    )

    priority = result.get(
        "priority"
    )

    sentiment = result.get(
        "sentiment"
    )

    confidence = result.get(
        "confidence"
    )


    # --------------------------------------------------------
    # CATEGORY VALIDATION
    # --------------------------------------------------------

    if category not in allowed_categories:

        category = "Technical"


    # --------------------------------------------------------
    # PRIORITY VALIDATION
    # --------------------------------------------------------

    if priority not in allowed_priorities:

        priority = "Medium"


    # --------------------------------------------------------
    # SENTIMENT VALIDATION
    # --------------------------------------------------------

    if sentiment not in allowed_sentiments:

        sentiment = "Neutral"


    # --------------------------------------------------------
    # CONFIDENCE VALIDATION
    # --------------------------------------------------------

    try:

        confidence = float(
            confidence
        )

    except (
        TypeError,
        ValueError
    ):

        confidence = 0.0


    # --------------------------------------------------------
    # KEEP CONFIDENCE BETWEEN 0 AND 1
    # --------------------------------------------------------

    confidence = max(
        0.0,
        min(
            1.0,
            confidence
        )
    )


    # --------------------------------------------------------
    # ROUND CONFIDENCE
    # --------------------------------------------------------

    confidence = round(
        confidence,
        4
    )


    # --------------------------------------------------------
    # RETURN VALIDATED RESULT
    # --------------------------------------------------------

    return {
        "category": category,
        "priority": priority,
        "sentiment": sentiment,
        "confidence": confidence
    }


# ============================================================
# AI CONFIDENCE LEVEL
# ============================================================

def get_confidence_level(
    confidence: float | None
) -> str:

    if confidence is None:

        return "Low"


    try:

        confidence = float(
            confidence
        )

    except (
        TypeError,
        ValueError
    ):

        return "Low"


    # --------------------------------------------------------
    # KEEP CONFIDENCE BETWEEN 0 AND 1
    # --------------------------------------------------------

    confidence = max(
        0.0,
        min(
            1.0,
            confidence
        )
    )


    # --------------------------------------------------------
    # CONFIDENCE LEVEL
    # --------------------------------------------------------

    if confidence >= 0.80:

        return "High"


    if confidence >= 0.60:

        return "Medium"


    return "Low"


# ============================================================
# TEST CLASSIFICATION
# ============================================================

if __name__ == "__main__":

    test_tickets = [

        {
            "title": "Payment methods",
            "description": (
                "What payment methods can I use "
                "to pay for my order?"
            )
        },

        {
            "title": "Duplicate payment",
            "description": (
                "My card was charged twice "
                "for the same order. Please refund "
                "one payment."
            )
        },

        {
            "title": "Forgot password",
            "description": (
                "I forgot my password and cannot "
                "log into my account."
            )
        },

        {
            "title": "Application crashing",
            "description": (
                "The application crashes every time "
                "I try to upload a file."
            )
        },

        {
            "title": "Package not arrived",
            "description": (
                "My package was supposed to arrive "
                "yesterday but I still have not "
                "received it."
            )
        },

        {
            "title": "Office address",
            "description": (
                "What is your company's office address?"
            )
        },

        # ----------------------------------------------------
        # NEW PROFILE UPDATE TEST
        # ----------------------------------------------------

        {
            "title": "Unable to update my profile",
            "description": (
                "I am trying to update my profile "
                "information, but the changes are not "
                "being saved."
            )
        }
    ]


    print("\n")
    print("=" * 70)
    print("AI CLASSIFICATION TEST")
    print("=" * 70)


    for number, ticket in enumerate(
        test_tickets,
        start=1
    ):

        print("\n")
        print("=" * 70)
        print(
            f"TEST {number}"
        )
        print("=" * 70)

        print("\nTitle:")
        print(
            ticket["title"]
        )

        print("\nDescription:")
        print(
            ticket["description"]
        )


        result = classify_ticket(
            ticket["title"],
            ticket["description"]
        )


        # ----------------------------------------------------
        # VALIDATE RESULT
        # ----------------------------------------------------

        result = validate_classification_result(
            result
        )


        print("\nClassification Result:")
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
            f"Confidence: "
            f"{result['confidence']}"
        )

        print(
            f"Confidence Level: "
            f"{get_confidence_level(result['confidence'])}"
        )


    print("\n")
    print("=" * 70)
    print(
        "ALL CLASSIFICATION TESTS COMPLETED"
    )
    print("=" * 70)