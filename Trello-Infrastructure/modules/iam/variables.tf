variable "eks_cluster_role_name" {
  description = "Name of the IAM role for the EKS cluster"
  type        = string
  default     = "eks-cluster-role"
}

variable "eks_node_role_name" {
  description = "Name of the IAM role for the EKS node group"
  type        = string
  default     = "eks-node-role"
}
