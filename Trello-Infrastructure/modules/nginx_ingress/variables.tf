variable "replica_count" {
  description = "Number of NGINX ingress controller replicas"
  type        = number
}

variable "service_type" {
  description = "Service type for the NGINX ingress controller"
  type        = string
}

variable "namespace" {
  description = "Namespace to deploy the NGINX ingress controller"
  type        = string
}

variable "chart_version" {
  description = "Version of the NGINX ingress Helm chart"
  type        = string
}
