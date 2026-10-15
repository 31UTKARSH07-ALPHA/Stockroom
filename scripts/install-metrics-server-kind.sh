#!/usr/bin/env bash
set -euo pipefail

readonly manifest_url="https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.9.0/components.yaml"

kubectl apply -f "$manifest_url"

if ! kubectl get deployment metrics-server -n kube-system \
  -o jsonpath='{.spec.template.spec.containers[0].args}' \
  | grep -Fq -- '--kubelet-insecure-tls'; then
  kubectl patch deployment metrics-server -n kube-system --type=json \
    -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
fi

kubectl rollout status deployment/metrics-server -n kube-system --timeout=180s
kubectl wait --for=condition=Available apiservice/v1beta1.metrics.k8s.io --timeout=120s
kubectl top nodes
kubectl top pods -n stockroom
