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

GitHub Actions runs on pushes and pull requests targeting `main`. It installs backend dependencies, runs Pytest, and builds the frontend. On pushes to `main`, it also builds both container images, scans them with Trivy, and publishes the images to GHCR using the commit SHA as the tag. Scans fail on HIGH or CRITICAL findings with an available fix; findings that have no upstream fix yet are excluded from the blocking threshold. The workflow needs the repository's Actions setting for `GITHUB_TOKEN` to allow package writes.

Passing implementation run: [Stockroom CI/CD run 38633752094](https://github.com/31UTKARSH07-ALPHA/Stockroom/actions/runs/38633752094).

### Security scan note

Trivy scans operating system and Python/npm packages in both built images. The first backend scan found HIGH [Starlette CVE-2025-62727](https://avd.aquasec.com/nvd/cve-2025-62727) in version 0.46.2; upstream lists 0.49.1 as a fixed version. An older Prometheus instrumentation dependency constrained Starlette, so Stockroom now records request metrics directly with `prometheus-client`. The pipeline blocks fixable HIGH and CRITICAL findings; findings without an upstream fix are excluded from the blocking threshold.

### Published image tags

The workflow tags each image with its source commit SHA:

```text
ghcr.io/31utkarsh07-alpha/stockroom-backend:<commit-sha>
ghcr.io/31utkarsh07-alpha/stockroom-frontend:<commit-sha>
```

## Project tracking

The grading checklist and AI session handoff live in local-only `phase.md` and `agent_handoff.md` files. They are excluded from Git and are not part of the public repository.
