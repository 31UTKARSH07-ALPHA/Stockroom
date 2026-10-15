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

## Local Kubernetes deployment (Kind + Helm)

The local Kubernetes path runs on Docker Desktop and does not create AWS resources. It uses a Kind cluster, the Traefik ingress controller, and the Stockroom Helm chart. Start Docker Desktop before running these commands.

Create the cluster and namespace:

```bash
kind create cluster --name stockroom --config k8s/kind-config.yaml
kubectl apply -f k8s/namespace.yaml
```

Build and load the local images, install Traefik, then deploy Stockroom:

```bash
docker build -t stockroom-backend:local ./backend
docker build -t stockroom-frontend:local ./frontend
kind load docker-image stockroom-backend:local stockroom-frontend:local --name stockroom
helm repo add traefik https://traefik.github.io/charts
helm repo update traefik
helm upgrade --install traefik traefik/traefik --version 42.0.0 \
  --namespace ingress-system --create-namespace -f helm/traefik-values.yaml --wait
helm upgrade --install stockroom helm/stockroom --namespace stockroom --wait
```

Kind maps host port `8080` to the Traefik HTTP NodePort. Open `http://localhost:8080`; `/health` and `/api/products` are routed to the backend. Inspect the deployment with `kubectl get pods,svc,ingress -n stockroom -o wide` and `helm status stockroom -n stockroom`. The chart runs two backend and two frontend replicas with ClusterIP Services. Its PostgreSQL pod uses ephemeral storage and demo credentials, so this setup is for local learning rather than persistent or production data. The backend migration startup uses a PostgreSQL advisory lock so both replicas can start together.

To remove the local demo cluster when finished, run `kind delete cluster --name stockroom`.

## Local observability (Prometheus + Grafana)

The M9 observability stack is local to Kind; it provisions no cloud resources. The chart values keep retention ephemeral and disable optional exporters/Alertmanager to limit resource use. Prometheus discovers backend pods through their scrape annotations. Grafana is provisioned with the Prometheus datasource and a Stockroom API dashboard. These sample credentials and ephemeral data are for this local demo only.

```bash
helm upgrade --install stockroom helm/stockroom --namespace stockroom --wait
helm upgrade --install prometheus prometheus-community/prometheus --version 29.35.0 \
  --namespace observability --create-namespace -f observability/prometheus-values.yaml --wait
helm upgrade --install grafana grafana-community/grafana --version 14.0.0 \
  --namespace observability -f observability/grafana-values.yaml --wait
```

In one terminal, start the Prometheus port-forward:

```bash
kubectl port-forward -n observability service/prometheus-server 9090:80
```

In another terminal, start the Grafana port-forward:

```bash
kubectl port-forward -n observability service/grafana 3001:80
```

Prometheus is at `http://localhost:9090`; check **Status → Targets** for the two `stockroom` targets. Grafana is at `http://localhost:3001` (`admin` / `stockroom-local`); open the **Stockroom API Overview** dashboard for request rate and p95 latency. The backend metrics endpoint is `http://localhost:8080/metrics`.

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

## AWS Terraform reference (not deployed)

The `terraform/` directory contains a reference configuration for a demo AWS VPC and EKS cluster. This project is being deployed locally without AWS; Terraform has been initialized and validated, but no AWS plan or resources have been created. See [`terraform/README.md`](terraform/README.md) if you want to review the reference configuration.

## Project tracking

The grading checklist and AI session handoff live in local-only `phase.md` and `agent_handoff.md` files. They are excluded from Git and are not part of the public repository.
