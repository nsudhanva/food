# Running Locally

Now that everything is set up, let's verify our development environment works.

## Start the Databases

```bash
# From project root
docker compose up -d
```

## Run the Backend

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8080
```

:::note We Haven't Built This Yet
This command will fail right now because we haven't created `app/main.py` yet.

That's okay - we're just documenting what the command will be. Continue to the next sections to build the backend step by step.
:::

## Run the Frontend

```bash
cd frontend
bun run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173).

## Development Workflow

During development, you'll typically have three terminals:

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `docker compose up` | Run databases |
| 2 | `uv run uvicorn app.main:app --reload --port 8080` | Run backend |
| 3 | `bun run dev` | Run frontend |

The `--reload` flag for uvicorn and Vite's development server both support hot reloading - your changes will be reflected immediately without restarting.

## Verifying the Stack

Once everything is running, you should be able to:

1. **Frontend**: Open [http://localhost:5173](http://localhost:5173) - see the React app
2. **Backend API Docs**: Open [http://localhost:8080/docs](http://localhost:8080/docs) - see FastAPI's Swagger UI
3. **PostgreSQL**: Connect with any SQL client to `localhost:5432`
4. **ChromaDB**: Query the API at [http://localhost:8000](http://localhost:8000)

---

Before we start coding, let's understand the AI concepts that power our application.
