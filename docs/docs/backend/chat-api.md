# Chat API

The chat endpoint is the heart of our application. It receives user messages, retrieves relevant dishes, generates responses, and streams them back.

## Server-Sent Events (SSE)

We use SSE for streaming responses. Unlike WebSockets, SSE is:

- **Simple** - Just HTTP with special headers
- **One-way** - Server pushes to client
- **Auto-reconnect** - Built into browsers
- **Perfect for streaming** - Exactly what we need

## Step 1: The Chat Endpoint

Replace `app/api/chat.py`:

```python title="app/api/chat.py"
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.rag import retriever
from app.llm import openai_client

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    preferences: dict = {}


@router.post("/chat")
async def chat(request: ChatRequest):
    """Stream a chat response using SSE."""
    
    async def generate():
        # Step 1: Retrieve relevant dishes
        foods = retriever.search(
            query=request.message,
            exclude_allergens=request.preferences.get("allergies"),
            spice_level=request.preferences.get("spice_level"),
            dietary_type=request.preferences.get("dietary_type"),
            health_goals=request.preferences.get("health_goals"),
            top_k=5
        )
        
        # Step 2: Format context for LLM
        context = retriever.format_for_prompt(foods)
        
        # Step 3: Generate streaming response
        async for token in openai_client.generate_response(
            user_message=request.message,
            context=context,
            preferences=request.preferences
        ):
            # Format as SSE
            yield f"data: {json.dumps({'content': token})}\n\n"
        
        # Signal end of stream
        yield f"data: {json.dumps({'done': True})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
```

## Understanding SSE Format

SSE messages follow a specific format:

```
data: {"content": "Hello"}

data: {"content": " there!"}

data: {"done": true}

```

Each message:

1. Starts with `data:`
2. Contains the payload (we use JSON)
3. Ends with two newlines (`\n\n`)

## Step 2: The Flow

```
1. Client sends POST /api/chat
   Body: { message: "spicy breakfast", preferences: {...} }

2. Server searches ChromaDB
   → Returns: [Pesarattu, Upma, ...]

3. Server calls OpenAI with context
   → Streams tokens back

4. Client receives SSE events
   data: {"content": "Based"}
   data: {"content": " on"}
   data: {"content": " your"}
   ...
   data: {"done": true}

5. Client assembles complete response
   "Based on your preferences, I recommend Pesarattu..."
```

## Step 3: Request Validation

Pydantic validates incoming requests:

```python
class ChatRequest(BaseModel):
    message: str           # Required
    preferences: dict = {} # Optional, defaults to empty
```

Invalid requests automatically return 422 with details:

```json
{
  "detail": [
    {
      "loc": ["body", "message"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Step 4: Response Headers

```python
headers={
    "Cache-Control": "no-cache",     # Don't cache stream
    "Connection": "keep-alive",       # Keep connection open
    "X-Accel-Buffering": "no",       # For nginx/reverse proxies
}
```

These headers ensure:

- Browsers don't cache the response
- The connection stays open for streaming
- Reverse proxies don't buffer the stream

## Error Handling

Add proper error handling:

```python title="app/api/chat.py (improved)"
import json
import traceback
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import APIError

from app.rag import retriever
from app.llm import openai_client

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    preferences: dict = {}


@router.post("/chat")
async def chat(request: ChatRequest):
    """Stream a chat response using SSE."""
    
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    async def generate():
        try:
            # Retrieve relevant dishes
            foods = retriever.search(
                query=request.message,
                exclude_allergens=request.preferences.get("allergies"),
                spice_level=request.preferences.get("spice_level"),
                dietary_type=request.preferences.get("dietary_type"),
                health_goals=request.preferences.get("health_goals"),
                top_k=5
            )
            
            context = retriever.format_for_prompt(foods)
            
            # Stream response
            async for token in openai_client.generate_response(
                user_message=request.message,
                context=context,
                preferences=request.preferences
            ):
                yield f"data: {json.dumps({'content': token})}\n\n"
            
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except APIError as e:
            error_msg = f"OpenAI API error: {str(e)}"
            yield f"data: {json.dumps({'error': error_msg})}\n\n"
            
        except Exception as e:
            error_msg = f"An error occurred: {str(e)}"
            yield f"data: {json.dumps({'error': error_msg})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
```

## Testing the Endpoint

### With curl

```bash
curl -N -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should I have for breakfast?",
    "preferences": {
      "spice_level": "medium",
      "allergies": ["dairy"]
    }
  }'
```

The `-N` flag disables buffering so you see tokens in real-time.

### Expected Output

```
data: {"content": "Based"}
data: {"content": " on"}
data: {"content": " your"}
data: {"content": " preferences"}
...
data: {"content": "!"}
data: {"done": true}
```

## Client-Side Consumption

Here's how the frontend will consume this:

```javascript
// Frontend code (preview)
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message, preferences })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  // Parse SSE format
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.content) {
        appendToChat(data.content);
      }
    }
  }
}
```

## Complete Request/Response Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│ POST /api/chat                                                  │
│ Body: { message: "spicy breakfast", preferences: {...} }        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. Validate request (Pydantic)                                  │
│ 2. Search ChromaDB: "spicy breakfast" + filters                 │
│ 3. Format dishes as context string                              │
│ 4. Build prompt: system + context + preferences + message       │
│ 5. Call OpenAI with stream=True                                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stream tokens via SSE                                           │
│ data: {"content": "Based"}                                      │
│ data: {"content": " on"}                                        │
│ ...                                                              │
│ data: {"done": true}                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

Next, let's build the MCP server for AI tool access.
