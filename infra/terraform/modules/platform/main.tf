# The minimal loop-proving workload: one native k8s resource + one Helm release. Podinfo is
# a tiny, auth-free, stable public chart (Bitnami's free catalog was retired in 2025).
resource "kubernetes_namespace" "app" {
  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }
}

resource "helm_release" "demo" {
  name       = var.release_name
  namespace  = kubernetes_namespace.app.metadata[0].name
  repository = "https://stefanprodan.github.io/podinfo"
  chart      = "podinfo"
  version    = var.chart_version

  # Helm provider v3: `set` is a list of objects, not repeated blocks.
  set = [
    { name = "replicaCount", value = "1" },
    { name = "service.type", value = "ClusterIP" },
  ]

  wait    = true
  timeout = 300
}
