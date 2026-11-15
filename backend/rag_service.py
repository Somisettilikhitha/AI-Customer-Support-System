from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import numpy as np


# ============================================================
# CONFIGURATION
# ============================================================

EMBEDDING_MODEL = (
    "sentence-transformers/all-MiniLM-L6-v2"
)

GENERATION_MODEL = (
    "google/flan-t5-small"
)

TOP_K = 3

# Minimum similarity required before using retrieved FAQ
SIMILARITY_THRESHOLD = 0.50


# ============================================================
# FALLBACK RESPONSE
# ============================================================

FALLBACK_ANSWER = (
    "I don't have enough information "
    "to answer that question."
)


# ============================================================
# LOAD EMBEDDING MODEL
# ============================================================

print("Loading embedding model...")

embedding_model = SentenceTransformer(
    EMBEDDING_MODEL
)

print("Embedding model loaded.")


# ============================================================
# LOAD GENERATION MODEL
# ============================================================

print("Loading generation model...")

tokenizer = AutoTokenizer.from_pretrained(
    GENERATION_MODEL
)

generation_model = AutoModelForSeq2SeqLM.from_pretrained(
    GENERATION_MODEL
)

print("Generation model loaded.")


# ============================================================
# LOAD STORED EMBEDDINGS
# ============================================================

print("Loading stored embeddings...")

embeddings = np.load(
    "data/faq_embeddings.npy"
)

documents = np.load(
    "data/faq_documents.npy",
    allow_pickle=True
)

print(
    f"Loaded {len(documents)} documents."
)

print(
    f"Embedding shape: {embeddings.shape}"
)


# ============================================================
# COSINE SIMILARITY
# ============================================================

def cosine_similarity(
    query_embedding,
    document_embeddings
):

    query_norm = np.linalg.norm(
        query_embedding
    )

    document_norms = np.linalg.norm(
        document_embeddings,
        axis=1
    )

    # Avoid division by zero
    query_norm = max(
        query_norm,
        1e-12
    )

    document_norms = np.maximum(
        document_norms,
        1e-12
    )

    similarities = np.dot(
        document_embeddings,
        query_embedding
    ) / (
        document_norms *
        query_norm
    )

    return similarities


# ============================================================
# RETRIEVE RELEVANT DOCUMENTS
# ============================================================

def retrieve_documents(
    query: str,
    top_k: int = TOP_K
):

    if not query:
        return []

    # --------------------------------------------------------
    # EMBED QUERY
    # --------------------------------------------------------

    query_embedding = embedding_model.encode(
        query,
        convert_to_numpy=True
    )

    # --------------------------------------------------------
    # CALCULATE SIMILARITY
    # --------------------------------------------------------

    similarities = cosine_similarity(
        query_embedding,
        embeddings
    )

    # --------------------------------------------------------
    # GET TOP DOCUMENTS
    # --------------------------------------------------------

    top_indices = np.argsort(
        similarities
    )[::-1][:top_k]

    results = []

    for index in top_indices:

        results.append(
            {
                "document": str(
                    documents[index]
                ),
                "score": float(
                    similarities[index]
                )
            }
        )

    return results


# ============================================================
# EXTRACT ANSWER FROM FAQ DOCUMENT
# ============================================================

def extract_faq_answer(
    document: str
) -> str:

    """
    Extract the Answer section from a stored FAQ document.

    Expected document format:

    Question:
    How can I track my order?

    Answer:
    You can track your order by logging into your account...
    """

    if not document:
        return ""

    document = str(document).strip()

    # --------------------------------------------------------
    # Look for "Answer:"
    # --------------------------------------------------------

    answer_marker = "Answer:"

    if answer_marker in document:

        answer = document.split(
            answer_marker,
            1
        )[1].strip()

        if answer:
            return answer

    # --------------------------------------------------------
    # If document does not have expected format,
    # return the complete document.
    # --------------------------------------------------------

    return document


# ============================================================
# VALIDATE GENERATED ANSWER
# ============================================================

def validate_generated_answer(
    answer: str | None,
    query: str
) -> str:

    """
    Validate generated answer.

    Rejects:
    - None
    - empty output
    - output that exactly repeats the question
    - output that mostly repeats the question
    - very short/meaningless output
    """

    # --------------------------------------------------------
    # EMPTY ANSWER
    # --------------------------------------------------------

    if answer is None:
        return ""

    answer = answer.strip()

    if not answer:
        return ""


    # --------------------------------------------------------
    # EMPTY QUERY
    # --------------------------------------------------------

    if query is None:
        return ""

    query = query.strip()

    if not query:
        return ""


    # --------------------------------------------------------
    # NORMALIZE
    # --------------------------------------------------------

    normalized_answer = " ".join(
        answer.lower().split()
    )

    normalized_query = " ".join(
        query.lower().split()
    )


    # --------------------------------------------------------
    # EXACT QUESTION REPEAT
    # --------------------------------------------------------

    if normalized_answer == normalized_query:

        print(
            "AI repeated the customer question."
        )

        return ""


    # --------------------------------------------------------
    # QUESTION REPEAT WITHOUT QUESTION MARK
    # --------------------------------------------------------

    if (
        normalized_answer.rstrip("?")
        == normalized_query.rstrip("?")
    ):

        print(
            "AI repeated the customer question."
        )

        return ""


    # --------------------------------------------------------
    # CHECK QUESTION/ANSWER WORD OVERLAP
    # --------------------------------------------------------

    question_words = set(
        normalized_query.lower().split()
    )

    answer_words = set(
        normalized_answer.lower().split()
    )

    if question_words:

        overlap = len(
            question_words.intersection(
                answer_words
            )
        ) / len(question_words)

        print(
            f"Question-answer word overlap: "
            f"{overlap:.2f}"
        )

        if overlap >= 0.50:

            print(
                "AI answer contains too much "
                "of the customer's question."
            )

            return ""


    # --------------------------------------------------------
    # VERY SHORT OUTPUT
    # --------------------------------------------------------

    if len(normalized_answer) < 40:

        print(
            "AI answer is too short or incomplete."
        )

        return ""


    # --------------------------------------------------------
    # RETURN VALID ANSWER
    # --------------------------------------------------------

    return answer


# ============================================================
# GENERATE AI ANSWER FROM FAQ
# ============================================================

def generate_ai_answer(
    query: str,
    faq_context: str
) -> str:

    """
    Ask FLAN-T5 to generate a concise answer
    using only the retrieved FAQ.
    """

    prompt = (
        "You are a customer support assistant.\n"
        "Answer the customer's question using "
        "only the FAQ information below.\n"
        "Do not repeat the question.\n"
        "Do not invent information.\n"
        "Give a short, helpful answer.\n\n"

        "FAQ:\n"
        f"{faq_context}\n\n"

        "Customer question:\n"
        f"{query}\n\n"

        "Answer:"
    )


    # --------------------------------------------------------
    # TOKENIZE
    # --------------------------------------------------------

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        truncation=True,
        max_length=512
    )


    # --------------------------------------------------------
    # GENERATE
    # --------------------------------------------------------

    outputs = generation_model.generate(
        **inputs,

        max_new_tokens=80,

        num_beams=4,

        do_sample=False,

        early_stopping=True,

        no_repeat_ngram_size=3
    )


    # --------------------------------------------------------
    # DECODE
    # --------------------------------------------------------

    answer = tokenizer.decode(
        outputs[0],
        skip_special_tokens=True
    ).strip()


    print(
        f"\nRaw AI answer: {answer}"
    )


    return answer


# ============================================================
# MAIN RAG FUNCTION
# ============================================================

def generate_answer(
    query: str,
    top_k: int = TOP_K
):

    # ========================================================
    # VALIDATE QUERY
    # ========================================================

    if query is None:

        return {
            "question": "",
            "answer": FALLBACK_ANSWER,
            "sources": [],
            "confidence": 0.0
        }


    query = query.strip()


    if not query:

        return {
            "question": query,
            "answer": FALLBACK_ANSWER,
            "sources": [],
            "confidence": 0.0
        }


    # ========================================================
    # RETRIEVE DOCUMENTS
    # ========================================================

    results = retrieve_documents(
        query,
        top_k
    )


    # ========================================================
    # NO RESULTS
    # ========================================================

    if not results:

        print(
            "No FAQ documents retrieved."
        )

        return {
            "question": query,
            "answer": FALLBACK_ANSWER,
            "sources": [],
            "confidence": 0.0
        }


    # ========================================================
    # BEST SIMILARITY
    # ========================================================

    best_score = results[0]["score"]


    print(
        "\n================================================"
    )

    print(
        "RAG QUERY"
    )

    print(
        "================================================"
    )

    print(
        f"Question: {query}"
    )

    print(
        f"Best similarity score: {best_score:.4f}"
    )


    # ========================================================
    # UNKNOWN QUESTION
    # ========================================================

    if best_score < SIMILARITY_THRESHOLD:

        print(
            "Similarity below threshold."
        )

        print(
            "Returning fallback response."
        )

        return {
            "question": query,
            "answer": FALLBACK_ANSWER,
            "sources": results,
            "confidence": best_score
        }


    # ========================================================
    # GET BEST FAQ
    # ========================================================

    best_document = str(
        results[0]["document"]
    )


    print(
        "\nRetrieved FAQ:"
    )

    print(
        best_document
    )


    # ========================================================
    # EXTRACT STORED FAQ ANSWER
    # ========================================================

    faq_answer = extract_faq_answer(
        best_document
    )


    print(
        "\nStored FAQ answer:"
    )

    print(
        faq_answer
    )


    # ========================================================
    # GENERATE AI ANSWER
    # ========================================================

    print(
        "\nGenerating AI answer..."
    )


    try:

        ai_answer = generate_ai_answer(
            query,
            best_document
        )


        # ----------------------------------------------------
        # VALIDATE AI OUTPUT
        # ----------------------------------------------------

        validated_answer = (
            validate_generated_answer(
                ai_answer,
                query
            )
        )


    except Exception as error:

        print(
            "\nAI generation error:"
        )

        print(
            error
        )

        validated_answer = ""


    # ========================================================
    # CHOOSE FINAL ANSWER
    # ========================================================

    if validated_answer:

        final_answer = (
            validated_answer
        )

        print(
            "\nUsing generated AI answer."
        )

    elif faq_answer:

        final_answer = (
            faq_answer
        )

        print(
            "\nAI generation was not valid."
        )

        print(
            "Using retrieved FAQ answer instead."
        )

    else:

        final_answer = (
            FALLBACK_ANSWER
        )

        print(
            "\nNo valid FAQ answer found."
        )


    # ========================================================
    # FINAL RESULT
    # ========================================================

    print(
        f"\nFinal AI answer: {final_answer}"
    )


    return {
        "question": query,

        "answer": final_answer,

        "sources": results,

        "confidence": best_score
    }


# ============================================================
# TEST MULTIPLE RAG QUESTIONS
# ============================================================

if __name__ == "__main__":

    test_questions = [

        # TEST 1
        "Where can I track my shipment?",

        # TEST 2
        "What payment methods can I use?",

        # TEST 3
        "Can I return a product I purchased?",

        # TEST 4
        "How do I create an account?",

        # TEST 5
        "Can I cancel my order before it is shipped?",

        # TEST 6
        "What is your company's office address?",

        # TEST 7
        "My payment is still failing. I tried again but the payment was declined.",

        # TEST 8
        "My card payment was declined during checkout.",

        # TEST 9
        "Why did my payment fail?"
    ]


    print("\n")

    print(
        "=" * 70
    )

    print(
        "RAG MULTIPLE QUESTION TEST"
    )

    print(
        "=" * 70
    )


    # ========================================================
    # RUN TESTS
    # ========================================================

    for number, query in enumerate(
        test_questions,
        start=1
    ):

        print("\n")

        print(
            "=" * 70
        )

        print(
            f"TEST {number}"
        )

        print(
            "=" * 70
        )


        # ----------------------------------------------------
        # QUESTION
        # ----------------------------------------------------

        print(
            "\nQuestion:"
        )

        print(
            query
        )


        # ----------------------------------------------------
        # GENERATE ANSWER
        # ----------------------------------------------------

        result = generate_answer(
            query
        )


        # ----------------------------------------------------
        # GENERATED ANSWER
        # ----------------------------------------------------

        print(
            "\nGenerated Answer:"
        )

        print(
            "-------------------------"
        )

        print(
            result["answer"]
        )


        # ----------------------------------------------------
        # CONFIDENCE
        # ----------------------------------------------------

        print(
            "\nRAG Confidence:"
        )

        print(
            "-------------------------"
        )

        print(
            f"{result['confidence']:.4f}"
        )


        # ----------------------------------------------------
        # TOP SOURCE
        # ----------------------------------------------------

        print(
            "\nTop Retrieved Source:"
        )

        print(
            "-------------------------"
        )


        if result["sources"]:

            source = result[
                "sources"
            ][0]


            print(
                f"Similarity: "
                f"{source['score']:.4f}"
            )


            print(
                "\n"
            )


            print(
                source["document"]
            )

        else:

            print(
                "No source retrieved."
            )


    # ========================================================
    # COMPLETE
    # ========================================================

    print("\n")

    print(
        "=" * 70
    )

    print(
        "ALL RAG TESTS COMPLETED"
    )

    print(
        "=" * 70
    )