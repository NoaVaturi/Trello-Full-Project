variable "region" {
  description = "AWS region to deploy resources"
  type        = string
}

variable "eks_cluster_role_name" {
  description = "Name for the EKS cluster IAM role"
  type        = string
}

variable "eks_node_role_name" {
  description = "Name for the EKS node IAM role"
  type        = string
}

variable "vpc_cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "vpc_name" {
  description = "Name for the VPC"
  type        = string
}

variable "public_subnet_count" {
  description = "Number of public subnets"
  type        = number
}

variable "private_subnet_count" {
  description = "Number of private subnets"
  type        = number
}

variable "public_subnet_name_prefix" {
  description = "Prefix for public subnet names"
  type        = string
}

variable "private_subnet_name_prefix" {
  description = "Prefix for private subnet names"
  type        = string
}

variable "igw_name" {
  description = "Name for the internet gateway"
  type        = string
}

variable "public_route_table_name" {
  description = "Name for the public route table"
  type        = string
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "node_group_name" {
  description = "Name of the EKS node group"
  type        = string
}

variable "desired_size" {
  description = "Desired number of nodes"
  type        = number
}

variable "max_size" {
  description = "Maximum number of nodes"
  type        = number
}

variable "min_size" {
  description = "Minimum number of nodes"
  type        = number
}

variable "instance_types" {
  description = "List of EC2 instance types"
  type        = list(string)
}

variable "nginx_replica_count" {
  description = "Replica count for nginx ingress controller"
  type        = number
}

variable "nginx_service_type" {
  description = "Service type for nginx ingress controller"
  type        = string
}

variable "namespace" {
  description = "Namespace for ArgoCD"
  type        = string
}

variable "release_name" {
  description = "Helm release name for ArgoCD"
  type        = string
}

variable "chart_repository" {
  description = "Helm repository for ArgoCD"
  type        = string
}

variable "chart_name" {
  description = "Chart name for ArgoCD"
  type        = string
}

variable "chart_version" {
  description = "Chart version for ArgoCD"
  type        = string
}

variable "values_file_path" {
  description = "Path to ArgoCD values.yaml"
  type        = string
}

variable "helm_timeout" {
  description = "Helm installation timeout"
  type        = number
}

variable "nginx_chart_version" {
  description = "Chart version for nginx ingress"
  type        = string
}

variable "nginx_namespace" {
  description = "Namespace for nginx ingress"
  type        = string
}

variable "eks_kubernetes_version" {
  description = "Version of Kubernetes for EKS"
  type        = string
}

