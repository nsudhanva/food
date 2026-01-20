# Vector Databases

Vector databases are a key component of RAG. They enable **semantic search** - finding items by meaning, not just keywords.

## The Problem with Traditional Search

Consider searching for "light morning meal":

**Keyword Search (SQL LIKE)**

```sql
SELECT * FROM dishes WHERE description LIKE '%light%' AND description LIKE '%morning%'
```

This would miss:

- "Idli" - described as "soft, fluffy, easy to digest breakfast"
- "Upma" - described as "gentle semolina dish for starting your day"

These are exactly what the user wants, but they don't contain "light" or "morning".

**Semantic Search (Vector DB)**

```
Query: "light morning meal" → [0.23, -0.45, 0.67, ...] (embedding)

Find dishes with similar embeddings:
1. Idli (similarity: 0.94) ✓
2. Upma (similarity: 0.91) ✓ 
3. Poha (similarity: 0.88) ✓
```

The vector database understands that "light morning meal" is semantically similar to "easy to digest breakfast".

## What is a Vector?

A vector is just a list of numbers. In our context:

```
"Idli" → [0.234, -0.456, 0.789, 0.012, -0.345, ...]
         ↑
         1536 numbers that represent the "meaning"
```

These numbers are called an **embedding**. Each dimension captures some aspect of meaning:

- One dimension might represent "spiciness"
- Another might represent "breakfast-ness"
- Another might represent "South Indian-ness"

(In reality, the dimensions don't map to human concepts this cleanly, but you get the idea.)

## How Vector Search Works

```
             User Query                              Database
         ┌───────────────┐                    ┌───────────────────┐
         │"spicy snack"  │                    │ Samosa [0.8, 0.2] │
         └───────┬───────┘                    │ Pakora [0.7, 0.3] │
                 │                            │ Idli   [0.1, 0.9] │
                 ▼                            │ Kheer  [0.0, 0.1] │
         ┌───────────────┐                    └───────────────────┘
         │ Embedding API │                              │
         │ (OpenAI)      │                              │
         └───────┬───────┘                              │
                 │                                      │
                 ▼                                      │
         [0.75, 0.25]  ◄────── Find closest ───────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Results:      │
         │ 1. Samosa     │  ← closest to [0.75, 0.25]
         │ 2. Pakora     │
         └───────────────┘
```

## ChromaDB

We use **ChromaDB** as our vector database because:

- **Simple** - Easy to set up and use
- **Embeddable** - Can run in-process or as a server
- **Metadata filtering** - Filter by cuisine, spice level, etc.
- **Open source** - Free to use

### Basic ChromaDB Operations

```python
import chromadb

# Connect to ChromaDB
client = chromadb.HttpClient(host="localhost", port=8000)

# Create a collection (like a table)
collection = client.get_or_create_collection("foods")

# Add documents
collection.add(
    ids=["1", "2"],
    documents=["Idli is a soft steamed rice cake", "Samosa is a spicy fried snack"],
    metadatas=[
        {"cuisine": "south_indian", "spice_level": "mild"},
        {"cuisine": "north_indian", "spice_level": "medium"}
    ]
)

# Search
results = collection.query(
    query_texts=["I want something mild for breakfast"],
    n_results=2,
    where={"spice_level": "mild"}  # Filter by metadata
)
# Returns: Idli
```

## Metadata Filtering

This is where vector databases shine for our use case. We can combine:

1. **Semantic similarity** - "light breakfast" matches "easy to digest"
2. **Exact filters** - Only South Indian dishes
3. **Exclusions** - No dishes containing dairy

```python
results = collection.query(
    query_texts=["healthy protein-rich breakfast"],
    n_results=5,
    where={
        "$and": [
            {"cuisine": {"$in": ["south_indian", "north_indian"]}},
            {"allergens": {"$nin": ["dairy", "gluten"]}},
            {"is_vegetarian": True}
        ]
    }
)
```

## Vector DB vs Traditional DB

| Feature | PostgreSQL | ChromaDB |
|---------|------------|----------|
| Search type | Keyword, LIKE | Semantic similarity |
| Query | SQL | Natural language |
| Filters | WHERE clause | Metadata filters |
| Best for | Structured data, transactions | Unstructured text, similarity |

In our app, we use **both**:

- **ChromaDB** - For semantic food search
- **PostgreSQL** - For user accounts, preferences, chat history

---

Next, let's understand embeddings - the magic that converts text to vectors.
