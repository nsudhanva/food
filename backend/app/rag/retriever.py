import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings


def get_chroma_client():
    return chromadb.HttpClient(
        host=settings.chroma_host,
        port=settings.chroma_port,
        settings=ChromaSettings(anonymized_telemetry=False),
    )


def get_collection():
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=settings.chroma_collection,
        metadata={"hnsw:space": "cosine"}
    )


def search_foods(
    query: str,
    allergies: list[str] | None = None,
    dietary_type: str | None = None,
    cuisines: list[str] | None = None,
    spice_level: str | None = None,
    meal_type: str | None = None,
    n_results: int = 5,
) -> list[dict]:
    collection = get_collection()
    
    where_filters = []
    
    if allergies:
        for allergen in allergies:
            where_filters.append({"$not": {"allergens": {"$contains": allergen}}})
    
    if dietary_type:
        where_filters.append({"tags": {"$contains": dietary_type}})
    
    if spice_level:
        where_filters.append({"spice_level": spice_level})
    
    if meal_type:
        where_filters.append({"meal_type": meal_type})
    
    where = None
    if where_filters:
        if len(where_filters) == 1:
            where = where_filters[0]
        else:
            where = {"$and": where_filters}
    
    try:
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"],
        )
        
        foods = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                foods.append({
                    "id": results["ids"][0][i],
                    "content": doc,
                    "metadata": metadata,
                    "score": 1 - results["distances"][0][i] if results["distances"] else 0,
                })
        
        return foods
    except Exception as e:
        print(f"ChromaDB search error: {e}")
        return []


def get_food_by_id(food_id: str) -> dict | None:
    collection = get_collection()
    
    try:
        result = collection.get(
            ids=[food_id],
            include=["documents", "metadatas"],
        )
        
        if result["documents"]:
            return {
                "id": food_id,
                "content": result["documents"][0],
                "metadata": result["metadatas"][0] if result["metadatas"] else {},
            }
        return None
    except Exception as e:
        print(f"ChromaDB get error: {e}")
        return None
