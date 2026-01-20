# Indian Food Companion

AI-powered Indian vegetarian food recommendation chat app with personalized dietary preferences, allergen-safe filtering, and streaming responses.

## Quick Start

```bash
# Clone and enter the repo
git clone <repo-url> && cd food

# Set your OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# One-command setup
./setup.sh
```

Open <http://localhost:5173> and start chatting.

---

## Architecture

```mermaid
graph TB
    subgraph Client
        UI["React + shadcn/ui"]
    end
    
    subgraph Docker["Docker Compose"]
        subgraph Frontend
            NGINX["NGINX :5173"]
        end
        
        subgraph Backend
            API["FastAPI :8080"]
            MCP["MCP Server"]
        end
        
        subgraph Storage
            PG[("PostgreSQL :5432")]
            CHROMA[("ChromaDB :8001")]
        end
    end
    
    subgraph External
        OPENAI["OpenAI API"]
    end
    
    UI --> NGINX
    NGINX --> API
    API --> MCP
    API --> PG
    API --> CHROMA
    API --> OPENAI
```

---

## How It Works

### RAG Pipeline (Retrieval-Augmented Generation)

The app uses a RAG architecture to provide contextually relevant food recommendations. Instead of relying solely on the LLM's training data, we retrieve relevant dishes from our curated database first.

```mermaid
sequenceDiagram
    participant User
    participant API as FastAPI
    participant Chroma as ChromaDB
    participant OpenAI

    User->>API: "I want something spicy for breakfast"
    API->>Chroma: Semantic search query + filters
    Note over Chroma: Embedding similarity search<br/>+ allergen exclusion<br/>+ dietary filters
    Chroma-->>API: Top 5 relevant dishes
    API->>OpenAI: User query + Retrieved context + System prompt
    OpenAI-->>API: Streaming response
    API-->>User: SSE stream with recommendations
```

**Why RAG?**

- The LLM doesn't need to "know" every dish - we provide the context
- Recommendations are always from our verified, curated dataset
- Easy to add new dishes without retraining
- Allergen filtering happens at retrieval, not generation

---

### ChromaDB: Vector Search Engine

ChromaDB stores dish embeddings for semantic similarity search. When a user asks for "something light and healthy", we don't do keyword matching - we find dishes whose descriptions are semantically similar.

```mermaid
flowchart LR
    subgraph Ingestion["Data Ingestion"]
        JSON["foods.json<br/>57 dishes"] --> Embed["OpenAI<br/>Embeddings"]
        Embed --> Store["ChromaDB<br/>Collection"]
    end
    
    subgraph Query["Query Time"]
        Q["User Query"] --> QEmbed["Query<br/>Embedding"]
        QEmbed --> Search["Similarity<br/>Search"]
        Search --> Filter["Metadata<br/>Filters"]
        Filter --> Results["Top K<br/>Results"]
    end
    
    Store -.-> Search
```

**Metadata Filtering:**

```python
# Example: Find high-protein South Indian dishes, excluding dairy
where={
    "$and": [
        {"cuisine": "south_indian"},
        {"is_high_protein": True},
        {"allergens": {"$nin": ["dairy"]}}
    ]
}
```

---

### OpenAI Integration

We use OpenAI's GPT-4o-mini for response generation with streaming for real-time UX.

```mermaid
flowchart TB
    subgraph Context["Context Assembly"]
        SYS["System Prompt<br/>(Indian food expert)"]
        PREFS["User Preferences<br/>(spice, allergies)"]
        DOCS["Retrieved Dishes<br/>(from ChromaDB)"]
    end
    
    subgraph Generation["Response Generation"]
        PROMPT["Combined Prompt"]
        STREAM["Streaming<br/>Completion"]
        SSE["Server-Sent<br/>Events"]
    end
    
    SYS --> PROMPT
    PREFS --> PROMPT
    DOCS --> PROMPT
    PROMPT --> STREAM
    STREAM --> SSE
```

**System Prompt Structure:**

```text
You are an expert on Indian vegetarian cuisine...

User Preferences:
- Spice Level: Medium
- Allergies: Dairy
- Health Goals: High Protein

Available Dishes (from database):
1. Pesarattu - High protein South Indian crepe...
2. Sprouts Salad - Protein-rich healthy option...
...

Based on these dishes, recommend options for: {user_query}
```

---

### MCP (Model Context Protocol) Tools

MCP provides a standardized way for AI models to interact with external tools and data sources. Our MCP server exposes three tools:

```mermaid
flowchart LR
    subgraph MCPServer["MCP Server"]
        T1["search_food"]
        T2["get_food_details"]
        T3["save_preferences"]
    end
    
    subgraph Resources["Data Resources"]
        CHROMA[("ChromaDB")]
        PG[("PostgreSQL")]
    end
    
    AI["AI Agent<br/>(Claude, etc.)"] <--> MCPServer
    T1 <--> CHROMA
    T2 <--> CHROMA
    T3 <--> PG
```

| Tool | Description | Parameters |
|------|-------------|------------|
| `search_food` | Semantic search with filters | `query`, `cuisine?`, `spice_level?`, `exclude_allergens?` |
| `get_food_details` | Full dish information | `food_name` |
| `save_preferences` | Persist user dietary prefs | `user_id`, `preferences` |

**MCP enables:**

- IDE integrations (Claude Desktop, VS Code)
- Multi-agent workflows
- Standardized tool calling across different AI providers

---

## Components

```mermaid
graph LR
    subgraph FE["Frontend"]
        App["App.tsx"]
        Chat["ChatMessage"]
        Composer["ChatComposer"]
        Prefs["PreferencesDialog"]
    end
    
    subgraph BE["Backend"]
        ChatAPI["Chat API"]
        PrefsAPI["Preferences API"]
        AdminAPI["Admin API"]
    end
    
    subgraph RAG["RAG Pipeline"]
        Retriever["Retriever"]
        LLM["OpenAI Client"]
    end
    
    App --> Chat
    App --> Composer
    App --> Prefs
    Composer --> ChatAPI
    ChatAPI --> Retriever
    ChatAPI --> LLM
    Prefs --> PrefsAPI
```

---

## Data Flow

```mermaid
flowchart TB
    subgraph UserAction["User Action"]
        MSG["Send Message"]
        PREF["Update Preferences"]
    end
    
    subgraph Backend["Backend Processing"]
        direction TB
        PARSE["Parse Request"]
        RETRIEVE["Retrieve Relevant Dishes"]
        FILTER["Apply Preference Filters"]
        GENERATE["Generate Response"]
    end
    
    subgraph Storage["Persistence"]
        CHROMA[("ChromaDB<br/>Vector Store")]
        PG[("PostgreSQL<br/>User Data")]
        LOCAL["localStorage<br/>Client Prefs"]
    end
    
    MSG --> PARSE
    PARSE --> RETRIEVE
    RETRIEVE --> CHROMA
    CHROMA --> FILTER
    FILTER --> GENERATE
    GENERATE --> MSG
    
    PREF --> PG
    PREF --> LOCAL
```

---

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React + Vite |
| UI | shadcn/ui + Tailwind |
| Package Manager | Bun |
| Backend | FastAPI |
| Python Deps | uv |
| Vector DB | ChromaDB |
| Database | PostgreSQL |
| LLM | OpenAI gpt-4o-mini |
| Tools | MCP Python SDK |
| Documentation | Docusaurus |

---

> [!TIP]
> **Build this app from scratch!**
> I've included a comprehensive step-by-step guide. Run `cd docs && bun start` to view it.

## Project Structure

```text
food/
├── setup.sh
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   ├── db/
│   │   ├── rag/
│   │   ├── llm/
│   │   └── mcp/
│   └── data/
│       └── foods.json
└── frontend/
    ├── package.json
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── App.tsx
        ├── components/
        ├── hooks/
        └── lib/
```

---

## Development

### Local Development (without Docker)

**Backend:**

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8080
```

**Frontend:**

```bash
cd frontend
bun install
bun run dev
```

**Services (Postgres + ChromaDB):**

```bash
docker compose up postgres chroma -d
```

### Seed Data

```bash
curl -X POST http://localhost:8080/api/admin/ingest
```

### API Docs

Visit <http://localhost:8080/docs> for interactive Swagger UI.

---

## Features

### Personalized Recommendations

- Dietary preferences (spice level, cuisine types)
- Allergen exclusion (dairy, gluten, nuts, etc.)
- Health goals (high protein, low carb, etc.)

### Streaming Chat

- Real-time SSE streaming responses
- Quick prompt chips for common queries
- Preference persistence via localStorage

### Comprehensive Food Database

- 57 authentic Indian vegetarian dishes
- South Indian, North Indian, Gujarati, Bengali, Rajasthani, Maharashtrian cuisines
- Nutrition data, prep times, spice levels

### MCP Tools

- `search_food` - Semantic search with filtering
- `get_food_details` - Get full food info
- `save_preferences` - Update user prefs

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | `/api/chat` | SSE streaming chat |
| GET | `/api/preferences/{user_id}` | Get preferences |
| PUT | `/api/preferences/{user_id}` | Update preferences |
| GET | `/api/conversations/{user_id}` | List conversations |
| POST | `/api/admin/ingest` | Seed food data |
| GET | `/api/admin/stats` | DB statistics |

---

## Environment Variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `OPENAI_API_KEY` | OpenAI API key | (required) |
| `DATABASE_URL` | Postgres connection | `postgresql://food:food@postgres:5432/food` |
| `CHROMA_HOST` | ChromaDB host | `chroma` |
| `CHROMA_PORT` | ChromaDB port | `8000` |

---

## Cleanup

```bash
# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

---

## License

MIT
