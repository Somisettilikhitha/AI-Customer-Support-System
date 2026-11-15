
from datasets import load_dataset
from sentence_transformers import SentenceTransformer
import numpy as np
import os


# ============================================================
# CONFIGURATION
# ============================================================

DATASET_NAME = "MakTek/Customer_support_faqs_dataset"

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

DATA_DIR = "data"


# ============================================================
# LOAD DATASET
# ============================================================

print("Loading customer support dataset...")

dataset = load_dataset(DATASET_NAME)
train_data = dataset["train"]

print(f"Loaded {len(train_data)} FAQ records.")


# ============================================================
# PREPARE ORIGINAL DOCUMENTS
# ============================================================

documents = []

for item in train_data:
    question = str(item["question"]).strip()
    answer = str(item["answer"]).strip()

    if not question or not answer:
        continue

    text = f"Question:\n{question}\n\nAnswer:\n{answer}"
    documents.append(text)


print(f"Prepared {len(documents)} original documents.")


# ============================================================
# ADD PROJECT-SPECIFIC FAQs
# ============================================================

project_faqs = [
    {
        "question": "What should I do if my payment fails?",
        "answer": (
            "If your payment fails, check that your payment details "
            "are correct and that your card has sufficient funds. "
            "You can also try another supported payment method. "
            "If the payment continues to fail, contact customer support."
        ),
    },
    {
        "question": "Why was my card payment declined?",
        "answer": (
            "A card payment may be declined because of incorrect card "
            "details, insufficient funds, bank restrictions, or security "
            "checks. Verify your payment information. If the problem "
            "continues, contact your bank or customer support."
        ),
    },
    {
        "question": "My payment was declined during checkout. What should I do?",
        "answer": (
            "Verify your card details and available balance, then try "
            "again or use another supported payment method. If the "
            "problem continues, contact customer support."
        ),
    },
    {
        "question": "My payment is still failing. What should I do?",
        "answer": (
            "Verify your payment details and available balance. Try "
            "another supported payment method if available. If the "
            "issue continues, contact customer support."
        ),
    },
    {
        "question": "Why did my payment fail?",
        "answer": (
            "A payment can fail because of incorrect payment details, "
            "insufficient funds, bank restrictions, or security checks. "
            "Verify your payment information and contact customer "
            "support if the issue continues."
        ),
    },
    {
        "question": "What should I do if my account is locked?",
        "answer": (
            "If your account is locked after multiple unsuccessful "
            "login attempts, follow the instructions displayed on the "
            "login page. If you are asked to wait, wait for the specified "
            "period before trying again. You can use the Forgot Password "
            "option if you need to reset your password. If you still "
            "cannot access your account, contact customer support. "
            "Never share your password or verification codes."
        ),
    },
    {
        "question": (
            "My account is locked after multiple unsuccessful login "
            "attempts. How can I regain access?"
        ),
        "answer": (
            "Follow the instructions displayed on the login page for "
            "a locked account. If a waiting period is specified, wait "
            "before trying again. If you cannot regain access, contact "
            "customer support for assistance."
        ),
    },
]


print(f"Adding {len(project_faqs)} project-specific FAQs...")

for faq in project_faqs:
    text = (
        f"Question:\n{faq['question']}\n\n"
        f"Answer:\n{faq['answer']}"
    )
    documents.append(text)


# ============================================================
# REMOVE DUPLICATE DOCUMENTS
# ============================================================

unique_documents = []
seen_documents = set()

for document in documents:
    normalized = " ".join(document.casefold().split())

    if normalized not in seen_documents:
        seen_documents.add(normalized)
        unique_documents.append(document)

documents = unique_documents

print(f"Unique FAQ documents after deduplication: {len(documents)}")


# ============================================================
# VALIDATE DOCUMENTS
# ============================================================

if not documents:
    raise ValueError("No FAQ documents were loaded.")

if not any(
    "account is locked" in doc.casefold()
    for doc in documents
):
    raise ValueError("Locked-account FAQ is missing.")


# ============================================================
# LOAD EMBEDDING MODEL
# ============================================================

print("\nLoading embedding model...")

model = SentenceTransformer(EMBEDDING_MODEL)

print("Embedding model loaded.")


# ============================================================
# GENERATE EMBEDDINGS
# ============================================================

print("\nGenerating embeddings...")

embeddings = model.encode(
    documents,
    show_progress_bar=True,
    convert_to_numpy=True,
    normalize_embeddings=True,
)

print("Embeddings generated successfully!")
print("Number of documents:", len(documents))
print("Embedding shape:", embeddings.shape)


# ============================================================
# SAVE OUTPUTS
# ============================================================

os.makedirs(DATA_DIR, exist_ok=True)

# Save to temporary files first so the previous files are not
# overwritten until both new files have been generated.
embedding_temp = os.path.join(DATA_DIR, "faq_embeddings.tmp.npy")
documents_temp = os.path.join(DATA_DIR, "faq_documents.tmp.npy")

np.save(embedding_temp, embeddings)
np.save(
    documents_temp,
    np.array(documents, dtype=object),
)

# Replace the old files after both temporary files are written.
os.replace(
    documents_temp,
    os.path.join(DATA_DIR, "faq_documents.npy"),
)
os.replace(
    embedding_temp,
    os.path.join(DATA_DIR, "faq_embeddings.npy"),
)

print("\nUpdated files:")
print(os.path.join(DATA_DIR, "faq_documents.npy"))
print(os.path.join(DATA_DIR, "faq_embeddings.npy"))
print("\nEmbedding generation completed successfully!")
