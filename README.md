# Stockroom

Inventory management for small teams. Track products, stock levels, categories, and inventory value in one place.

## Stack

- React + Vite frontend
- FastAPI backend with SQLAlchemy and PostgreSQL
- Alembic database migrations
- Pytest API tests

## Local development

1. Start PostgreSQL and create a database named `stockroom` (or set `DATABASE_URL`).
2. In a terminal, install and start the backend:

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   export DATABASE_URL='postgresql+psycopg://stockroom:stockroom@localhost:5432/stockroom'
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```

3. In another terminal, install and start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Open the Vite URL (usually `http://localhost:5173`). The API is available at `http://localhost:8000/docs`; health and metrics are at `/health` and `/metrics`.

## Run the full stack with Docker Compose

With Docker running, start the frontend, API, and PostgreSQL together:

```bash
docker compose up --build
```

Open `http://localhost:3000`. The backend API docs are at `http://localhost:8000/docs`. Compose runs the Alembic migration when the backend starts. Stop the stack with `docker compose down`; add `-v` only when you also want to delete the local database volume.

## CI pipeline

GitHub Actions runs on pushes and pull requests targeting `main`. It installs backend dependencies, runs Pytest, and builds the frontend. On pushes to `main`, it also builds both container images, scans them with Trivy (the pipeline fails for HIGH or CRITICAL findings), then publishes the images to GHCR using the commit SHA as the tag. The workflow needs the repository's Actions setting for `GITHUB_TOKEN` to allow package writes.

## Project tracking

The grading checklist and AI session handoff live in local-only `phase.md` and `agent_handoff.md` files. They are excluded from Git and are not part of the public repository.
