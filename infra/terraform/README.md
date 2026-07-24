# Terraform — local k3d (GCP later)

Learning-oriented IaC that provisions a local **k3d** (k3s-in-docker) cluster and deploys a
demo workload, structured so the same layout maps onto GKE later.

## Layout

Two independent state roots per environment (the load-bearing decision):

- `environments/local/cluster` — creates the k3d cluster (via the `k3d-cluster` module,
  which drives the `k3d` CLI). Maps to GKE later.
- `environments/local/platform` — in-cluster workloads (namespace + a podinfo Helm release
  via the `platform` module). **Portable** — unchanged when moving to GCP.

They are kept separate because the kubernetes/helm providers can't be configured against a
cluster that doesn't exist yet in the same apply.

## Tools

```bash
brew tap hashicorp/tap && brew install hashicorp/tap/terraform  # BSL-licensed; not homebrew-core
brew install k3d helm                                           # kubectl assumed present
```

## Bring up / tear down

```bash
cd environments/local/cluster && terraform init && terraform apply   # k3d cluster
cd ../platform && terraform init && terraform apply                  # namespace + podinfo
kubectl -n taktikon-local get deploy,svc                             # verify

# teardown (reverse)
cd ../platform && terraform destroy
cd ../cluster && terraform destroy
```

## GCP later

`environments/gcp/` mirrors the split: the `cluster` root uses the `google` provider
(GKE + node pool), the `platform` root is reused as-is, and state moves to a GCS backend.
Managed Postgres/Redis (Cloud SQL / Memorystore) replace the local docker-compose services.
