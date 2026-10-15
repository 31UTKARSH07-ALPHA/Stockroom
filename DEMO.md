# Stockroom demo guide

This run-through shows the inventory CRUD workflow, CSV export, CI pipeline, local Kubernetes rollout, and live observability. It uses Docker Desktop and Kind; it does not create AWS resources.

## 1. Show the app

Open `http://localhost:8080`. Add a sample product such as:

| Field | Value |
| --- | --- |
| SKU | DEMO-001 |
| Name | Field Notebook |
| Category | Stationery |
| Quantity | 24 |
| Price | 4.50 |

Show the new row and inventory totals. Edit the quantity to 18, then use **Export** to download `stockroom-inventory.csv`. The export includes SKU, name, category, quantity, and price. Delete the sample row to show the delete flow.

## 2. Show the pipeline

Open the GitHub Actions run for the latest commit. Show the test/frontend build job, image builds, Trivy scans, and SHA-tagged GHCR push. The workflow link is in the project README and Actions tab.

## 3. Deploy the same source revision to Kind

Use the full commit SHA shown on GitHub for `IMAGE_TAG` below. Build and load that revision into Kind, then change the Helm frontend image tag to the matching SHA. This demonstrates a new ReplicaSet and rollout from the committed source:

```bash
IMAGE_TAG=<full-commit-sha>
docker build -t stockroom-frontend:$IMAGE_TAG ./frontend
kind load docker-image stockroom-frontend:$IMAGE_TAG --name stockroom
helm upgrade --install stockroom helm/stockroom --namespace stockroom \
  --set frontend.image.tag=$IMAGE_TAG --wait
kubectl rollout status deployment/stockroom-frontend -n stockroom
kubectl get pods -n stockroom -o wide
curl -I http://localhost:8080
```

Reload the app and show the Export button. To restore the chart's default `local` image tag after the demo, rebuild/load `stockroom-frontend:local`, then run:

```bash
helm upgrade --install stockroom helm/stockroom --namespace stockroom --reset-values --wait
```

## 4. Show observability

Prometheus is at `http://localhost:9090/targets`; the `stockroom` job should show 2/2 targets UP. Grafana is at `http://localhost:3001/d/stockroom-overview/stockroom-api-overview`; sign in with the local demo account documented in the README and show the request-rate and latency panels.

## Evidence checklist

- [ ] `evidence/m10-export-feature.png` — Stockroom page with inventory and Export button
- [ ] `evidence/m10-actions-run.png` — green workflow for the M10 commit
- [ ] `evidence/m10-k8s-rollout.png` — terminal showing the SHA-tagged frontend rollout and ready replicas
- [ ] Optional short demo recording, if desired
