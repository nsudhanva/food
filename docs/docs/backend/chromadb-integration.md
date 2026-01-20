# ChromaDB Integration

ChromaDB is our vector database for semantic food search. Let's set it up and create our retriever.

## ChromaDB Basics

ChromaDB organizes data into **collections** (like tables). Each item in a collection has:

- **ID** - Unique identifier
- **Document** - The text content
- **Embedding** - Vector representation (auto-generated or provided)
- **Metadata** - Key-value pairs for filtering

## Step 1: Create the Retriever

Create `app/rag/retriever.py`:

```python title="app/rag/retriever.py"
import json
import chromadb
from chromadb.config import Settings

from app.core.config import settings

class FoodRetriever:
    def __init__(self):
        # Connect to ChromaDB server
        self.client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port
        )
        
        # Get or create our collection
        self.collection = self.client.get_or_create_collection(
            name="foods",
            metadata={"description": "Indian vegetarian food database"}
        )
    
    def add_foods(self, foods: list[dict]):
        """Add food items to the collection."""
        ids = []
        documents = []
        metadatas = []
        
        for food in foods:
            ids.append(food["id"])
            
            # Create rich document for embedding
            doc = self._create_document(food)
            documents.append(doc)
            
            # Store metadata for filtering
            metadatas.append({
                "name": food["name"],
                "cuisine": food["cuisine"],
                "spice_level": food["spice_level"],
                "meal_type": json.dumps(food["meal_type"]),
                "allergens": json.dumps(food.get("allergens", [])),
                "is_vegetarian": food.get("is_vegetarian", True),
                "is_vegan": food.get("is_vegan", False),
                "is_high_protein": food.get("is_high_protein", False),
                "is_low_carb": food.get("is_low_carb", False),
            })
        
        # Upsert (insert or update)
        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        
        return len(ids)
    
    def _create_document(self, food: dict) -> str:
        """Create a rich text representation for embedding."""
        parts = [
            f"{food['name']}: {food['description']}",
            f"Cuisine: {food['cuisine']}",
            f"Region: {food.get('region', 'India')}",
            f"Meal types: {', '.join(food['meal_type'])}",
            f"Spice level: {food['spice_level']}",
            f"Ingredients: {', '.join(food.get('ingredients', []))}",
        ]
        
        # Add health tags
        if food.get("is_high_protein"):
            parts.append("High protein dish")
        if food.get("is_low_carb"):
            parts.append("Low carb option")
        
        return "\n".join(parts)
```

### Key Decisions

**Why create a rich document?**

The document is what gets embedded. More context = better semantic matching:

```python
# Bad: Just the name
"Masala Dosa"

# Good: Rich context
"""
Masala Dosa: A crispy, savory crepe made from fermented rice batter
Cuisine: south_indian
Region: Karnataka
Meal types: breakfast, dinner
Spice level: medium
Ingredients: rice, urad dal, potato, onion, spices
"""
```

**Why store metadata separately?**

Metadata enables exact filtering that doesn't rely on embeddings:

```python
# "Find vegan dishes" - metadata filter is exact
where={"is_vegan": True}

# "Find something spicy" - relies on embedding similarity
query_texts=["spicy food"]
```

## Step 2: Add Search Method

Continue in `app/rag/retriever.py`:

```python title="app/rag/retriever.py (continued)"
    def search(
        self,
        query: str,
        cuisine: str = None,
        spice_level: str = None,
        meal_type: str = None,
        exclude_allergens: list[str] = None,
        dietary_type: str = None,
        top_k: int = 5
    ) -> list[dict]:
        """Search for foods matching the query and filters."""
        
        # Build where clause
        where_conditions = []
        
        if cuisine:
            where_conditions.append({"cuisine": cuisine})
        
        if spice_level:
            where_conditions.append({"spice_level": spice_level})
        
        if dietary_type == "vegan":
            where_conditions.append({"is_vegan": True})
        
        # Build the where clause
        where = None
        if len(where_conditions) == 1:
            where = where_conditions[0]
        elif len(where_conditions) > 1:
            where = {"$and": where_conditions}
        
        # Execute query
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k * 2,  # Get extra, we'll filter more
            where=where
        )
        
        # Post-filter for allergens (ChromaDB doesn't support $nin on arrays well)
        foods = []
        for i, id in enumerate(results["ids"][0]):
            metadata = results["metadatas"][0][i]
            
            # Check allergens
            if exclude_allergens:
                food_allergens = json.loads(metadata.get("allergens", "[]"))
                if any(a in food_allergens for a in exclude_allergens):
                    continue
            
            foods.append({
                "id": id,
                "name": metadata["name"],
                "cuisine": metadata["cuisine"],
                "spice_level": metadata["spice_level"],
                "document": results["documents"][0][i],
                "score": results["distances"][0][i] if results["distances"] else None
            })
            
            if len(foods) >= top_k:
                break
        
        return foods
    
    def get_by_name(self, name: str) -> dict | None:
        """Get a specific food by name."""
        results = self.collection.get(
            where={"name": name},
            limit=1
        )
        
        if not results["ids"]:
            return None
        
        return {
            "id": results["ids"][0],
            "name": results["metadatas"][0]["name"],
            "document": results["documents"][0],
            **results["metadatas"][0]
        }
    
    def get_count(self) -> int:
        """Get total number of foods in collection."""
        return self.collection.count()


# Singleton instance
retriever = FoodRetriever()
```

## Step 3: Understanding the Search Flow

```
User query: "high protein breakfast"

Step 1: Build filters
       where = {"is_high_protein": True}

Step 2: Query ChromaDB
       query_texts=["high protein breakfast"]
       
       ChromaDB internally:
       1. Embeds "high protein breakfast" → [0.23, 0.45, ...]
       2. Finds similar document embeddings
       3. Applies metadata filter
       4. Returns ranked results

Step 3: Post-filter allergens
       Remove any dishes with user's allergens

Step 4: Return formatted results
       [
         {"name": "Pesarattu", "score": 0.92, ...},
         {"name": "Sprouts Salad", "score": 0.87, ...}
       ]
```

## Step 4: Export the Retriever

Create `app/rag/__init__.py`:

```python title="app/rag/__init__.py"
from .retriever import retriever, FoodRetriever

__all__ = ["retriever", "FoodRetriever"]
```

## Step 5: Create the Admin Ingest Endpoint

Update `app/api/admin.py`:

```python title="app/api/admin.py"
import json
from pathlib import Path
from fastapi import APIRouter

from app.rag import retriever

router = APIRouter(tags=["admin"])

@router.post("/admin/ingest")
async def ingest_data():
    """Load food data into ChromaDB."""
    # Load from JSON file
    data_path = Path(__file__).parent.parent.parent / "data" / "foods.json"
    
    with open(data_path) as f:
        foods = json.load(f)
    
    # Add to ChromaDB
    count = retriever.add_foods(foods)
    
    return {
        "message": f"Ingested {count} foods",
        "total_in_db": retriever.get_count()
    }

@router.get("/admin/stats")
async def get_stats():
    """Get database statistics."""
    return {
        "foods_count": retriever.get_count()
    }
```

## Testing the Retriever

After starting ChromaDB and ingesting data:

```bash
# Ingest food data
curl -X POST http://localhost:8080/api/admin/ingest

# Test search (once chat endpoint is built)
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I want something spicy for breakfast"}'
```

## ChromaDB Query Options

```python
# Basic query
results = collection.query(
    query_texts=["breakfast"],
    n_results=5
)

# With metadata filter
results = collection.query(
    query_texts=["breakfast"],
    where={"cuisine": "south_indian"}
)

# Multiple conditions (AND)
results = collection.query(
    query_texts=["breakfast"],
    where={
        "$and": [
            {"cuisine": "south_indian"},
            {"spice_level": "mild"}
        ]
    }
)

# Multiple conditions (OR)
results = collection.query(
    query_texts=["breakfast"],
    where={
        "$or": [
            {"cuisine": "south_indian"},
            {"cuisine": "north_indian"}
        ]
    }
)

# Include/exclude specific fields
results = collection.query(
    query_texts=["breakfast"],
    include=["documents", "metadatas", "distances"]
)
```

---

Next, let's create the OpenAI client for generating responses.
