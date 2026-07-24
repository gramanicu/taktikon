output "kube_context" {
  value      = "k3d-${terraform_data.cluster.input.name}"
  depends_on = [terraform_data.cluster]
}

output "cluster_name" {
  value = terraform_data.cluster.input.name
}
