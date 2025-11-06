resource "kubernetes_namespace" "argocd" {
  metadata {
    name = var.namespace
  }
}

resource "helm_release" "argocd" {
  name       = var.release_name
  repository = var.chart_repository
  chart      = var.chart_name
  namespace  = kubernetes_namespace.argocd.metadata[0].name
  version    = var.chart_version

  values = [file(var.values_file_path)]

  depends_on = [var.depends_on_resource]

  timeout = var.helm_timeout
  wait    = true
}
