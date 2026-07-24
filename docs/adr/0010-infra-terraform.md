# ADR-0010 — Infrastructure as code (Terraform + local k3d)

**Status:** accepted · **Date:** 2026-07-24

## Decision

- **Terraform**, targeting a **local k3d** (k3s-in-docker) cluster now, structured so the
  layout maps onto GKE later. Partly a deliberate learning surface for GCP/GKE work.
- **Two independent state roots per environment** — `cluster` (creates the k3d cluster) and
  `platform` (in-cluster namespace + a podinfo Helm release). This split is load-bearing:
  the kubernetes/helm providers cannot be configured against a cluster that doesn't exist
  yet in the same apply. It also mirrors GKE (cluster root ≈ GKE; platform root is portable).
- **k3d** is driven by `terraform_data` + `local-exec` (no maintained official k3d
  provider); the destroy provisioner reads `self.input` since destroy blocks can't read
  `var.*`.
- **platform** uses `kubernetes_namespace` + a `helm_release` (podinfo — auth-free, stable;
  Bitnami's free catalog was retired in 2025). Helm provider **v3** syntax (`kubernetes = {}`
  nested object, `set = [{...}]` list).
- Tools installed via brew: Terraform from the **hashicorp tap** (BSL-licensed, not
  homebrew-core), `k3d`, `helm`. Commit `.terraform.lock.hcl`; gitignore `.terraform/` +
  state.

## Consequences

- Verified end-to-end: `init` + `validate` on both roots, then a full **apply → verify →
  destroy** — podinfo reached `deployed` in a real k3d cluster, then torn down clean.
- Provider apply emits deprecation warnings (non-fatal) on the kubernetes/helm v3 line.

## GCP later (`environments/gcp/`)

Same cluster/platform split: the cluster root swaps to the `google` provider
(GKE + node pool), the platform root is reused unchanged, state moves to a GCS backend, and
Cloud SQL / Memorystore modules replace the local docker-compose Postgres/Redis.
