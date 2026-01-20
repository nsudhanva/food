# Docker Compose

Let's containerize our application for easy deployment.

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                       │
│                                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ nginx   │  │ backend │  │ postgres│  │ chroma  │   │
│  │ :5173   │  │ :8080   │  │ :5432   │  │ :8000   │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │
│       │            │            │            │         │
│       │            └────────────┴────────────┘         │
│       │                         │                      │
│       └─────────────────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

## Complete docker-compose.yml

```yaml title="docker-compose.yml"
services:
  # PostgreSQL database
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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U food"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ChromaDB vector database
  chroma:
    image: chromadb/chroma:0.5.0
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma
    environment:
      - ANONYMIZED_TELEMETRY=False

  # FastAPI backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://food:food@postgres:5432/food
      - CHROMA_HOST=chroma
      - CHROMA_PORT=8000
    depends_on:
      postgres:
        condition: service_healthy
      chroma:
        condition: service_started
    volumes:
      - ./backend:/app  # For development hot-reload

  # React frontend (production build served by nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  chroma_data:
```

## Backend Dockerfile

```dockerfile title="backend/Dockerfile"
FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files
COPY pyproject.toml .
COPY README.md .

# Install dependencies
RUN uv sync --frozen

# Copy application code
COPY app/ ./app/
COPY data/ ./data/

# Expose port
EXPOSE 8080

# Run the application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

## Frontend Dockerfile

```dockerfile title="frontend/Dockerfile"
# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## Nginx Configuration

```nginx title="frontend/nginx.conf"
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header X-Accel-Buffering no;
    }
}
```

### Key Nginx Settings

```nginx
# SPA routing - return index.html for all routes
try_files $uri $uri/ /index.html;

# SSE support - disable buffering for streaming
proxy_buffering off;
proxy_set_header X-Accel-Buffering no;
```

## Environment Variables

Create a `.env` file in the project root:

```bash title=".env"
OPENAI_API_KEY=sk-your-api-key-here
```

Docker Compose automatically loads this file.

## Running the Stack

### Start Everything

```bash
docker compose up --build
```

This will:

1. Build the backend and frontend images
2. Pull postgres and chroma images
3. Start all services
4. Wait for dependencies (postgres health check)

### Start in Background

```bash
docker compose up -d --build
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
```

### Stop Everything

```bash
docker compose down
```

### Remove Data

```bash
docker compose down -v  # Also removes volumes
```

## Seeding Data

After the stack is running, seed the food database:

```bash
curl -X POST http://localhost:8080/api/admin/ingest
```

Or enter the backend container:

```bash
docker compose exec backend uv run python -c "
from app.rag import retriever
import json
with open('data/foods.json') as f:
    foods = json.load(f)
retriever.add_foods(foods)
print(f'Added {len(foods)} foods')
"
```

## Development vs Production

### Development

Use volume mounts for hot-reload:

```yaml
backend:
  volumes:
    - ./backend:/app
```

### Production

Remove volume mounts and use multi-stage builds:

```yaml
backend:
  # No volumes - use built image only
```

## Service URLs

Once running:

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:8080` |
| API Docs | `http://localhost:8080/docs` |
| PostgreSQL | `localhost:5432` |
| ChromaDB | `http://localhost:8000` |

---

Next, let's cover production deployment tips.
