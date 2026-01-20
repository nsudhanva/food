# FastAPI Setup

Let's build our backend API using FastAPI. We'll start with the basic structure and add features incrementally.

## Why FastAPI?

- **Fast** - One of the fastest Python frameworks
- **Async** - Built-in async/await support (perfect for streaming)
- **Auto-docs** - Swagger UI generated automatically
- **Type hints** - Great IDE support and validation

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI application
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py     # Environment variables
│   ├── api/
│   │   ├── __init__.py
│   │   ├── chat.py       # Chat endpoint
│   │   ├── preferences.py
│   │   └── admin.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py   # Database connection
│   │   └── models.py     # SQLModel models
│   ├── rag/
│   │   ├── __init__.py
│   │   └── retriever.py  # ChromaDB retriever
│   ├── llm/
│   │   ├── __init__.py
│   │   └── openai_client.py
│   └── mcp/
│       ├── __init__.py
│       └── server.py     # MCP tool server
└── data/
    └── foods.json        # Food database
```

## Step 1: Configuration

Create `app/core/config.py` to manage environment variables:

```python title="app/core/config.py"
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    
    # Database
    database_url: str = "postgresql://food:food@localhost:5432/food"
    
    # ChromaDB
    chroma_host: str = "localhost"
    chroma_port: int = 8000
    
    # App
    debug: bool = False
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

This uses Pydantic to:

- Load from environment variables
- Fall back to `.env` file
- Provide type validation
- Set sensible defaults

## Step 2: Main Application

Create `app/main.py`:

```python title="app/main.py"
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import init_db
from app.api import chat, preferences, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    await init_db()
    yield
    # Shutdown: Cleanup if needed

app = FastAPI(
    title="Indian Food Companion API",
    version="1.0.0",
    lifespan=lifespan
)

# Allow frontend to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api")
app.include_router(preferences.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Key Concepts

**Lifespan Events**

The `@asynccontextmanager` pattern handles startup and shutdown:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # This runs on startup
    await init_db()
    
    yield  # Application runs here
    
    # This runs on shutdown
    await cleanup()
```

**CORS Middleware**

Cross-Origin Resource Sharing allows your frontend (port 5173) to call your backend (port 8080):

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],  # GET, POST, etc.
    allow_headers=["*"],
)
```

**Routers**

We organize endpoints into separate files (routers):

```python
# In chat.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/chat")
async def chat():
    ...

# In main.py
app.include_router(chat.router, prefix="/api")
# Creates: POST /api/chat
```

## Step 3: Create Empty Routers

Create placeholder routers so the app can start:

```python title="app/api/__init__.py"
from . import chat, preferences, admin
```

```python title="app/api/chat.py"
from fastapi import APIRouter

router = APIRouter(tags=["chat"])

@router.post("/chat")
async def chat_endpoint():
    return {"message": "Chat endpoint - coming soon"}
```

```python title="app/api/preferences.py"
from fastapi import APIRouter

router = APIRouter(tags=["preferences"])

@router.get("/preferences/{user_id}")
async def get_preferences(user_id: str):
    return {"user_id": user_id, "preferences": {}}
```

```python title="app/api/admin.py"
from fastapi import APIRouter

router = APIRouter(tags=["admin"])

@router.post("/admin/ingest")
async def ingest_data():
    return {"message": "Ingest endpoint - coming soon"}
```

## Step 4: Run the Server

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8080
```

Open [http://localhost:8080/docs](http://localhost:8080/docs) to see the auto-generated API documentation.

## FastAPI Features We'll Use

| Feature | Use Case |
|---------|----------|
| `async/await` | Non-blocking I/O for database and API calls |
| `@router.post` | Define HTTP endpoints |
| `Depends()` | Dependency injection (database sessions, auth) |
| `StreamingResponse` | SSE for real-time chat |
| Pydantic models | Request/response validation |
| Background tasks | Async operations after response |

## Next Steps

Our FastAPI app is running but doesn't do anything useful yet. Let's add:

1. Database models for users and preferences
2. ChromaDB integration for food search
3. OpenAI client for LLM responses
4. The actual chat endpoint with streaming

---

Next, let's set up our database models.
