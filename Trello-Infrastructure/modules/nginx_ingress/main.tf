resource "helm_release" "nginx_ingress" {
  name             = "ingress-nginx"
  repository       = "https://kubernetes.github.io/ingress-nginx"
  chart            = "ingress-nginx"
  namespace        = var.namespace
  create_namespace = true
  version          = var.chart_version

  values = [
    <<EOF
controller:
  replicaCount: ${var.replica_count}
  service:
    type: ${var.service_type}
EOF
  ]
}
