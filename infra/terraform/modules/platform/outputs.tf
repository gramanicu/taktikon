output "namespace" {
  value = kubernetes_namespace.app.metadata[0].name
}

output "release_status" {
  value = helm_release.demo.status
}
