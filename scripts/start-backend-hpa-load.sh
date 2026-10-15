#!/usr/bin/env bash
set -euo pipefail

readonly namespace="stockroom"
readonly pod="stockroom-hpa-load"
readonly workers="${HPA_LOAD_WORKERS:-12}"

kubectl delete pod "$pod" -n "$namespace" --ignore-not-found --wait=true
kubectl run "$pod" -n "$namespace" \
  --image=busybox:1.36 \
  --restart=Never \
  --env="WORKERS=$workers" \
  --command -- /bin/sh -c '
    stop_workers() {
      trap - TERM INT
      for child in $(jobs -p); do
        kill "$child" 2>/dev/null || true
      done
      wait || true
      exit 0
    }
    trap stop_workers TERM INT

    worker=0
    while [ "$worker" -lt "$WORKERS" ]; do
      (
        while true; do
          wget -q -O /dev/null http://stockroom-backend:8000/api/products || true
          sleep 0.1
        done
      ) &
      worker=$((worker + 1))
    done
    wait
  '
kubectl wait --for=condition=Ready "pod/$pod" -n "$namespace" --timeout=120s
