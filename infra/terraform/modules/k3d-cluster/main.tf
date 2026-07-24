# No official k3d Terraform provider exists; drive the k3d CLI out-of-band. All settings
# live in `input` so the destroy-time provisioner (which cannot read var.*) can use self.
resource "terraform_data" "cluster" {
  input = {
    name     = var.cluster_name
    servers  = var.servers
    agents   = var.agents
    api_port = var.api_port
    lb_port  = var.lb_port
  }

  provisioner "local-exec" {
    command = <<-EOT
      k3d cluster create ${self.input.name} \
        --servers ${self.input.servers} \
        --agents ${self.input.agents} \
        --api-port ${self.input.api_port} \
        --port "${self.input.lb_port}:80@loadbalancer" \
        --wait
    EOT
  }

  provisioner "local-exec" {
    when    = destroy
    command = "k3d cluster delete ${self.input.name}"
  }
}
