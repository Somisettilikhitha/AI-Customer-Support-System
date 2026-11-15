from sentence_transformers import SentenceTransformer
import numpy as np


# ============================================================
# LOAD EMBEDDING MODEL
# ============================================================

print("Loading embedding model...")

model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

print("Embedding model loaded.")


# ============================================================
# LOAD STORED DATA
# ============================================================

embeddings = np.load(
    "data/faq_embeddings.npy"
)

documents = np.load(
    "data/faq_documents.npy",
    allow_pickle=True
)

print(f"Loaded {len(documents)} documents.")
print(f"Embedding shape: {embeddings.shape}")


# ============================================================
# COSINE SIMILARITY
# ============================================================

def cosine_similarity(query_embedding, document_embeddings):

    query_norm = np.linalg.norm(query_embedding)

    document_norms = np.linalg.norm(
        document_embeddings,
        axis=1
    )

    similarities = np.dot(
        document_embeddings,
        query_embedding
    ) / (
        document_norms * query_norm
    )

    return similarities


# ============================================================
# SEARCH KNOWLEDGE BASE
# ============================================================

def search_knowledge_base(
    query: str,
    top_k: int = 3
):

    # --------------------------------------------------------
    # Convert query to embedding
    # --------------------------------------------------------

    query_embedding = model.encode(
        query,
        convert_to_numpy=True
    )

    # --------------------------------------------------------
    # Calculate similarity
    # --------------------------------------------------------

    similarities = cosine_similarity(
        query_embedding,
        embeddings
    )

    # --------------------------------------------------------
    # Get top results
    # --------------------------------------------------------

    top_indices = np.argsort(
        similarities
    )[::-1][:top_k]

    results = []

    for index in top_indices:

        results.append({
            "document": documents[index],
            "score": float(similarities[index])
        })

    return results


# ============================================================
# TEST SEARCH
# ============================================================

if __name__ == "__main__":

    query = "Where can I track my shipment?"

    print("\n")
    print("=" * 60)
    print("QUERY:")
    print(query)
    print("=" * 60)

    results = search_knowledge_base(
        query,
        top_k=3
    )

    for i, result in enumerate(results, start=1):

        print("\n")
        print(f"RESULT {i}")
        print("-" * 60)

        print("Similarity score:")
        print(round(result["score"], 4))

        print("\nDocument:")
        print(result["document"])