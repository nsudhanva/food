# RAG Explained

RAG (Retrieval-Augmented Generation) is the technique that makes our food recommendation app smart and accurate.

## The Problem RAG Solves

Imagine asking a regular LLM: "Recommend a high-protein South Indian breakfast."

The LLM might:

- Recommend dishes that don't exist
- Give incorrect nutrition information
- Suggest something with allergens you're avoiding
- Not know about regional specialties

**RAG solves this** by giving the LLM access to your own curated data.

## How RAG Works

```
┌──────────────────────────────────────────────────────────────────┐
│                         RAG Pipeline                             │
└──────────────────────────────────────────────────────────────────┘

Step 1: Query
┌─────────────────────────────────────────────────────────────────┐
│ User: "I want something spicy and healthy for breakfast"       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
Step 2: Retrieve
┌─────────────────────────────────────────────────────────────────┐
│ Search vector database for similar dishes                       │
│ Apply filters: spice_level=high, is_healthy=true, meal=breakfast│
│                                                                  │
│ Results:                                                         │
│   1. Pesarattu (score: 0.92) - Spicy green moong dal crepe      │
│   2. Upma with Chili (score: 0.87) - Spiced semolina            │
│   3. Masala Dosa (score: 0.85) - Crispy with spicy potato       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
Step 3: Augment
┌─────────────────────────────────────────────────────────────────┐
│ Build prompt with retrieved context:                             │
│                                                                  │
│ System: You are an Indian food expert.                          │
│                                                                  │
│ Available dishes from our database:                              │
│ 1. Pesarattu - A protein-rich crepe from Andhra Pradesh...      │
│ 2. Upma with Chili - A savory semolina dish...                  │
│ 3. Masala Dosa - A crispy fermented crepe...                    │
│                                                                  │
│ User wants: something spicy and healthy for breakfast            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
Step 4: Generate
┌─────────────────────────────────────────────────────────────────┐
│ LLM generates response using the context:                        │
│                                                                  │
│ "Based on your preferences, I recommend Pesarattu!               │
│  It's a protein-packed crepe from Andhra Pradesh made with      │
│  green moong dal. The green chilies give it a nice kick while   │
│  keeping it healthy. Serve it with ginger chutney for an        │
│  extra spice boost!"                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Why RAG is Powerful

| Aspect | Without RAG | With RAG |
|--------|-------------|----------|
| **Data source** | LLM's training data | Your curated database |
| **Accuracy** | May hallucinate | Grounded in real data |
| **Updates** | Need to retrain model | Just update database |
| **Control** | None | Full control over content |
| **Filtering** | Limited | Precise metadata filters |

## RAG in Our Application

Our RAG pipeline:

1. **User asks a question** → "What should I have for dinner?"

2. **We search ChromaDB** with:
   - Semantic similarity (meaning-based search)
   - Filters (exclude allergens, match dietary type)
   - User preferences (spice level, cuisines)

3. **We get relevant dishes** with their full details:
   - Name, description, ingredients
   - Nutrition info, prep time
   - Cuisine, spice level, allergens

4. **We build a prompt** that includes:
   - System instructions (be a food expert)
   - User preferences (stored locally)
   - Retrieved dishes (from ChromaDB)
   - The user's question

5. **LLM generates response** using only our data

6. **We stream the response** back to the user

## Code Preview

Here's a simplified version of our RAG pipeline:

```python
async def get_recommendation(query: str, preferences: dict):
    # Step 1: Retrieve relevant dishes
    dishes = retriever.search(
        query=query,
        exclude_allergens=preferences.get("allergies", []),
        spice_level=preferences.get("spice_level"),
        top_k=5
    )
    
    # Step 2: Build the prompt
    context = format_dishes_for_prompt(dishes)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Context:\n{context}\n\nQuery: {query}"}
    ]
    
    # Step 3: Generate response
    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        stream=True
    )
    
    return response
```

## Key Takeaways

1. **RAG = Retrieve + Augment + Generate**
2. **Your data stays in your control** - not sent for training
3. **Filtering happens at retrieval** - before the LLM sees it
4. **The LLM is just the "last mile"** - making the data conversational

---

Next, let's understand how vector databases enable the "retrieve" step.
