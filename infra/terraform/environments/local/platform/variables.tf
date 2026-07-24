variable "kube_context" {
  type    = string
  default = "k3d-taktikon-local"
}

variable "namespace" {
  type    = string
  default = "taktikon-local"
}

variable "release_name" {
  type    = string
  default = "demo"
}

variable "chart_version" {
  type    = string
  default = "6.7.1"
}
