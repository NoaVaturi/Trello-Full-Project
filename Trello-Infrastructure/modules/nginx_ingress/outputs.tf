output "nginx_ingress_namespace" {
  value = helm_release.nginx_ingress.namespace
}

output "nginx_ingress_name" {
  value = helm_release.nginx_ingress.name
}
