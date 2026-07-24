variable "cluster_name" {
  type    = string
  default = "taktikon-local"
}

variable "servers" {
  type    = number
  default = 1
}

variable "agents" {
  type    = number
  default = 1
}

variable "api_port" {
  type    = number
  default = 6550
}

variable "lb_port" {
  type    = number
  default = 8080
}
