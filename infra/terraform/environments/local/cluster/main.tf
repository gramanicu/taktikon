module "cluster" {
  source = "../../../modules/k3d-cluster"

  cluster_name = var.cluster_name
  servers      = var.servers
  agents       = var.agents
  api_port     = var.api_port
  lb_port      = var.lb_port
}
