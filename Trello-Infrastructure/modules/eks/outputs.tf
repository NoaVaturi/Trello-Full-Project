output "eks_cluster_name" {
  value = aws_eks_cluster.trello_cluster.name
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.trello_cluster.endpoint
}

output "eks_cluster_certificate_authority" {
  value = aws_eks_cluster.trello_cluster.certificate_authority[0].data
}

output "oidc_provider_arn" {
  description = "The ARN of the EKS cluster's OIDC provider"
  value       = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${replace(aws_eks_cluster.trello_cluster.identity[0].oidc[0].issuer, "https://", "")}"
}

data "aws_caller_identity" "current" {}

output "oidc_issuer_url" {
  description = "The URL of the EKS cluster's OIDC issuer"
  value       = aws_eks_cluster.trello_cluster.identity[0].oidc[0].issuer
}

output "cluster_version" {
  description = "The Kubernetes version of the EKS cluster"
  value       = aws_eks_cluster.trello_cluster.version
}