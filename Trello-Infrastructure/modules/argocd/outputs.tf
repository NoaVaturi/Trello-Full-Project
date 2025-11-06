output "argocd_namespace" {
  description = "The namespace ArgoCD is installed in"
  value       = kubernetes_namespace.argocd.metadata[0].name
}

output "argocd_release_status" {
  description = "Status of the ArgoCD Helm release"
  value       = helm_release.argocd.status
}
