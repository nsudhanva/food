# Project Setup

Let's create our project structure. We'll have a monorepo with separate `backend/` and `frontend/` directories.

## Directory Structure

```
food-companion/
├── backend/           # Python FastAPI server
│   ├── app/           # Application code
│   │   ├── api/       # API endpoints
│   │   ├── db/        # Database models
│   │   ├── rag/       # RAG pipeline
│   │   ├── llm/       # OpenAI integration
│   │   └── mcp/       # MCP server
│   └── data/          # Food dataset
├── frontend/          # React application
│   └── src/
│       ├── components/
│       ├── hooks/
│       └── lib/
├── docker-compose.yml
└── .env
```

## Initialize the Backend

### 1. Create the Backend Directory

```bash
mkdir -p backend/app/{api,db,rag,llm,mcp,core}
mkdir -p backend/data
```

### 2. Initialize Python Project with uv

```bash
cd backend
uv init
```

This creates a `pyproject.toml` file. Replace its contents with:

```toml title="backend/pyproject.toml"
[project]
name = "food-backend"
version = "0.1.0"
description = "Indian Food Companion Backend"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlmodel>=0.0.22",
    "asyncpg>=0.30.0",
    "psycopg2-binary>=2.9.10",
    "chromadb>=0.5.0",
    "openai>=1.50.0",
    "langchain>=0.3.0",
    "langchain-openai>=0.2.0",
    "langchain-chroma>=0.1.0",
    "mcp>=1.0.0",
    "pydantic-settings>=2.6.0",
    "sse-starlette>=2.1.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

### 3. Install Dependencies

```bash
uv sync
```

This creates a virtual environment and installs all dependencies.

## Initialize the Frontend

### 1. Create React App with Vite

```bash
cd ..  # Back to root
bun create vite frontend --template react-ts
cd frontend
bun install
```

### 2. Install Additional Dependencies

```bash
# UI components and styling
bun add tailwindcss @tailwindcss/vite

# shadcn/ui dependencies
bun add class-variance-authority clsx tailwind-merge
bun add lucide-react

# For API calls and markdown
bun add react-markdown remark-gfm
```

### 3. Configure Tailwind

Update `vite.config.ts`:

```typescript title="frontend/vite.config.ts"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

Create `src/index.css`:

```css title="frontend/src/index.css"
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
}

html, body, #root {
  height: 100%;
}

body {
  font-family: var(--font-sans);
  background: #020617;
  color: #f1f5f9;
}
```

## Environment Variables

Create a `.env` file in the project root:

```bash title=".env"
# OpenAI
OPENAI_API_KEY=sk-your-api-key-here

# Database
DATABASE_URL=postgresql://food:food@localhost:5432/food

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

:::danger Never Commit API Keys
Add `.env` to your `.gitignore` immediately:

```bash
echo ".env" >> .gitignore
```

:::

## Docker Compose for Databases

Create `docker-compose.yml` in the project root:

```yaml title="docker-compose.yml"
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: food
      POSTGRES_PASSWORD: food
      POSTGRES_DB: food
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  chroma:
    image: chromadb/chroma:0.5.0
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma

volumes:
  postgres_data:
  chroma_data:
```

Start the databases:

```bash
docker compose up -d
```

Verify they're running:

```bash
docker compose ps
```

You should see both `postgres` and `chroma` with status "Up".

---

Next, we'll start building the backend, but first let's understand the core concepts behind our AI-powered application.
