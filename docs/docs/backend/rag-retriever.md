# RAG Retriever

The RAG retriever orchestrates the retrieval step - getting relevant dishes before we send them to the LLM.

## The Retriever's Role

```
User Query → Retriever → ChromaDB → Relevant Dishes → LLM → Response
                ↑
         This component
```

We already built the core retriever in the ChromaDB section. Now let's see how it integrates with the rest of the system.

## Complete Retriever Code

Here's the full `app/rag/retriever.py`:

```python title="app/rag/retriever.py"
import json
from typing import Optional
import chromadb
from chromadb.config import Settings

from app.core.config import settings


class FoodRetriever:
    def __init__(self):
        self.client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port
        )
        self.collection = self.client.get_or_create_collection(
            name="foods",
            metadata={"description": "Indian vegetarian food database"}
        )
    
    def add_foods(self, foods: list[dict]) -> int:
        """Ingest food data into ChromaDB."""
        ids = []
        documents = []
        metadatas = []
        
        for food in foods:
            ids.append(str(food["id"]))
            documents.append(self._create_document(food))
            metadatas.append(self._create_metadata(food))
        
        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        
        return len(ids)
    
    def _create_document(self, food: dict) -> str:
        """Create embedding-friendly text representation."""
        parts = [
            f"{food['name']}: {food['description']}",
            f"Cuisine: {food['cuisine']} from {food.get('region', 'India')}",
            f"Best for: {', '.join(food.get('meal_type', ['any time']))}",
            f"Spice: {food.get('spice_level', 'medium')}",
        ]
        
        if food.get("ingredients"):
            parts.append(f"Made with: {', '.join(food['ingredients'])}")
        
        tags = []
        if food.get("is_high_protein"):
            tags.append("high protein")
        if food.get("is_low_carb"):
            tags.append("low carb")
        if food.get("is_vegan"):
            tags.append("vegan")
        if tags:
            parts.append(f"Tags: {', '.join(tags)}")
        
        return "\n".join(parts)
    
    def _create_metadata(self, food: dict) -> dict:
        """Create filterable metadata."""
        return {
            "name": food["name"],
            "cuisine": food.get("cuisine", "indian"),
            "spice_level": food.get("spice_level", "medium"),
            "meal_type": json.dumps(food.get("meal_type", [])),
            "allergens": json.dumps(food.get("allergens", [])),
            "is_vegetarian": food.get("is_vegetarian", True),
            "is_vegan": food.get("is_vegan", False),
            "is_high_protein": food.get("is_high_protein", False),
            "is_low_carb": food.get("is_low_carb", False),
            "prep_time": food.get("prep_time_minutes", 30),
        }
    
    def search(
        self,
        query: str,
        cuisine: Optional[str] = None,
        spice_level: Optional[str] = None,
        exclude_allergens: Optional[list[str]] = None,
        dietary_type: Optional[str] = None,
        health_goals: Optional[list[str]] = None,
        top_k: int = 5
    ) -> list[dict]:
        """Search for matching dishes."""
        
        # Build ChromaDB where clause
        where = self._build_where_clause(
            cuisine=cuisine,
            spice_level=spice_level,
            dietary_type=dietary_type,
            health_goals=health_goals
        )
        
        # Query with extra results for post-filtering
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k * 3,
            where=where if where else None
        )
        
        # Post-filter and format results
        return self._process_results(
            results,
            exclude_allergens=exclude_allergens,
            top_k=top_k
        )
    
    def _build_where_clause(
        self,
        cuisine: Optional[str],
        spice_level: Optional[str],
        dietary_type: Optional[str],
        health_goals: Optional[list[str]]
    ) -> Optional[dict]:
        """Build ChromaDB filter."""
        conditions = []
        
        if cuisine:
            conditions.append({"cuisine": cuisine})
        
        if spice_level:
            conditions.append({"spice_level": spice_level})
        
        if dietary_type == "vegan":
            conditions.append({"is_vegan": True})
        
        if health_goals:
            if "high_protein" in health_goals:
                conditions.append({"is_high_protein": True})
            if "low_carb" in health_goals:
                conditions.append({"is_low_carb": True})
        
        if not conditions:
            return None
        elif len(conditions) == 1:
            return conditions[0]
        else:
            return {"$and": conditions}
    
    def _process_results(
        self,
        results: dict,
        exclude_allergens: Optional[list[str]],
        top_k: int
    ) -> list[dict]:
        """Filter and format results."""
        foods = []
        
        if not results["ids"] or not results["ids"][0]:
            return foods
        
        for i, id in enumerate(results["ids"][0]):
            metadata = results["metadatas"][0][i]
            
            # Filter out allergens
            if exclude_allergens:
                food_allergens = json.loads(metadata.get("allergens", "[]"))
                if any(a in food_allergens for a in exclude_allergens):
                    continue
            
            foods.append({
                "id": id,
                "name": metadata["name"],
                "cuisine": metadata["cuisine"],
                "spice_level": metadata["spice_level"],
                "description": results["documents"][0][i],
            })
            
            if len(foods) >= top_k:
                break
        
        return foods
    
    def format_for_prompt(self, foods: list[dict]) -> str:
        """Format retrieved foods for the LLM prompt."""
        if not foods:
            return "No matching dishes found in the database."
        
        lines = []
        for i, food in enumerate(foods, 1):
            lines.append(f"{i}. {food['name']} ({food['cuisine']}, {food['spice_level']} spice)")
            lines.append(f"   {food['description']}")
            lines.append("")
        
        return "\n".join(lines)
    
    def get_by_name(self, name: str) -> Optional[dict]:
        """Get specific dish by name."""
        results = self.collection.get(
            where={"name": name},
            limit=1
        )
        
        if not results["ids"]:
            return None
        
        return {
            "id": results["ids"][0],
            **results["metadatas"][0],
            "description": results["documents"][0]
        }
    
    def get_count(self) -> int:
        """Get total dishes in database."""
        return self.collection.count()


# Singleton
retriever = FoodRetriever()
```

## Using the Retriever

In the chat endpoint:

```python
from app.rag import retriever

# Get relevant dishes
foods = retriever.search(
    query=user_message,
    exclude_allergens=preferences.get("allergies"),
    spice_level=preferences.get("spice_level"),
    health_goals=preferences.get("health_goals")
)

# Format for prompt
context = retriever.format_for_prompt(foods)

# Send to LLM
response = openai_client.generate_response(
    user_message=user_message,
    context=context,
    preferences=preferences
)
```

## The Retrieval Strategy

### Step 1: Semantic Search

ChromaDB finds dishes with similar meaning:

```
Query: "light morning meal"
Matches: "easy to digest breakfast", "gentle way to start the day"
```

### Step 2: Metadata Filtering

Apply exact filters before similarity ranking:

```python
where={"cuisine": "south_indian", "is_vegan": True}
```

### Step 3: Post-Filtering

Some filters are hard to express in ChromaDB (like array exclusions):

```python
# Can't easily do this in ChromaDB
where={"allergens": {"$nin": ["dairy", "nuts"]}}

# So we do it in Python
if any(a in food_allergens for a in exclude_allergens):
    continue  # Skip this food
```

### Step 4: Formatting

Convert results to a format the LLM can understand:

```
1. Pesarattu (south_indian, medium spice)
   Pesarattu: A protein-rich green moong dal crepe...
   Cuisine: south_indian from Andhra Pradesh
   Best for: breakfast
   
2. Idli (south_indian, mild spice)
   Idli: Soft, fluffy steamed rice cakes...
```

## Why Over-Fetch Then Filter?

```python
n_results=top_k * 3,  # Get 15 when we need 5
```

We fetch extra because:

1. Some may be filtered out for allergens
2. Ensures we always have enough results
3. ChromaDB query is fast anyway

## Testing the Retriever

```python
# In Python REPL or test file
from app.rag import retriever

# Test search
results = retriever.search(
    query="spicy breakfast",
    cuisine="south_indian",
    exclude_allergens=["dairy"],
    top_k=3
)

for r in results:
    print(f"- {r['name']}: {r['spice_level']}")

# Test formatting
print(retriever.format_for_prompt(results))
```

---

Next, let's build the chat API endpoint that ties everything together.
