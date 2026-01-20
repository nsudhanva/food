# Production Tips

When deploying to production, consider these best practices.

## Security

### Environment Variables

Never commit secrets. Use proper secret management:

```bash
# Bad - in docker-compose.yml
environment:
  - OPENAI_API_KEY=sk-actual-key-here

# Good - from .env file (not committed)
environment:
  - OPENAI_API_KEY=${OPENAI_API_KEY}

# Better - from secrets manager
# Use Docker secrets, Kubernetes secrets, or cloud provider secrets
```

### API Key Protection

The OpenAI API key is only on the backend. The frontend never sees it:

```
Frontend → Backend → OpenAI
           ↑
       Key is here
```

### Rate Limiting

Add rate limiting to prevent abuse:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/chat")
@limiter.limit("10/minute")  # 10 requests per minute
async def chat(request: Request, ...):
    ...
```

## Performance

### ChromaDB Persistence

Ensure ChromaDB data persists across restarts:

```yaml
chroma:
  volumes:
    - chroma_data:/chroma/chroma  # Named volume
```

### Database Connection Pooling

For high traffic, use connection pooling:

```python
from sqlalchemy.pool import QueuePool

engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
)
```

### Caching

Cache frequently accessed data:

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_food_by_name(name: str):
    return retriever.get_by_name(name)
```

## Scaling

### Horizontal Scaling

Run multiple backend instances behind a load balancer:

```yaml
backend:
  deploy:
    replicas: 3
```

### Database Connection Limits

PostgreSQL has connection limits. With multiple replicas:

```python
# Each replica: 5 connections
# 3 replicas = 15 connections
# Leave headroom for admin connections

pool_size = 5  # Per instance
```

## Monitoring

### Health Checks

Add comprehensive health checks:

```python
@app.get("/health")
async def health():
    checks = {
        "status": "healthy",
        "database": await check_database(),
        "chroma": await check_chroma(),
        "openai": await check_openai(),
    }
    return checks

async def check_database():
    try:
        async with async_session() as session:
            await session.execute("SELECT 1")
        return "ok"
    except Exception as e:
        return f"error: {str(e)}"
```

### Logging

Use structured logging:

```python
import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
        })

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
```

## Cost Optimization

### OpenAI Costs

Monitor your usage:

```python
# Log token usage
response = await client.chat.completions.create(...)
logger.info(f"Tokens used: {response.usage.total_tokens}")
```

### Use Appropriate Models

| Model | Cost | Use Case |
|-------|------|----------|
| gpt-4o-mini | Low | General responses |
| gpt-4o | Medium | Complex reasoning |
| gpt-4 | High | Rarely needed |

### Caching Responses

Cache common queries:

```python
import hashlib

def cache_key(message: str, preferences: dict) -> str:
    data = f"{message}:{json.dumps(preferences, sort_keys=True)}"
    return hashlib.md5(data.encode()).hexdigest()

# Check cache before calling OpenAI
cached = redis.get(cache_key(message, prefs))
if cached:
    return cached
```

## Deployment Options

### Docker on VPS

Simple and cost-effective:

```bash
ssh your-server
git clone your-repo
cd your-repo
docker compose up -d
```

### Kubernetes

For larger deployments, use Kubernetes with:

- Horizontal Pod Autoscaler
- Ingress for routing
- PersistentVolumeClaims for data
- Secrets for API keys

### Cloud Platforms

| Platform | Good For |
|----------|----------|
| Railway | Quick deploys |
| Fly.io | Edge deployment |
| AWS ECS | Enterprise scale |
| GCP Cloud Run | Serverless |

## Backup Strategy

### Database Backup

```bash
# Backup
docker compose exec postgres pg_dump -U food food > backup.sql

# Restore
docker compose exec -T postgres psql -U food food < backup.sql
```

### ChromaDB Backup

```bash
# Stop chroma, copy the volume
docker compose stop chroma
docker run --rm -v food_chroma_data:/data -v $(pwd):/backup alpine \
    tar czf /backup/chroma_backup.tar.gz /data
docker compose start chroma
```

## Checklist

Before going to production:

- [ ] API keys in secret manager
- [ ] Rate limiting enabled
- [ ] Health checks configured
- [ ] Logging set up
- [ ] Backups automated
- [ ] Monitoring in place
- [ ] HTTPS configured
- [ ] CORS restricted to your domain
- [ ] Error tracking (Sentry, etc.)

---

Congratulations! You've built a complete AI-powered food recommendation app from scratch.
