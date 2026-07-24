module "platform" {
  source = "../../../modules/platform"

  namespace     = var.namespace
  release_name  = var.release_name
  chart_version = var.chart_version
}
