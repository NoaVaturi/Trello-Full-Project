variable "namespace" {
  description = "Namespace to deploy ArgoCD"
  type        = string
}

variable "release_name" {
  description = "Helm release name"
  type        = string
}

variable "chart_repository" {
  description = "Helm chart repository for ArgoCD"
  type        = string
}

variable "chart_name" {
  description = "Name of the ArgoCD Helm chart"
  type        = string
}

variable "chart_version" {
  description = "Version of the ArgoCD Helm chart"
  type        = string
}

variable "values_file_path" {
  description = "Path to the ArgoCD values.yaml file"
  type        = string
}

variable "depends_on_resource" {
  description = "Resource to depend on (like EKS node group)"
  type        = any
}

variable "helm_timeout" {
  description = "Timeout for Helm installation"
  type        = number
}
