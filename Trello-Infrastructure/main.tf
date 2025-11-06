module "vpc" {
  source                     = "./modules/vpc"
  vpc_cidr_block             = var.vpc_cidr_block
  public_subnet_count        = var.public_subnet_count
  private_subnet_count       = var.private_subnet_count
  vpc_name                   = var.vpc_name
  public_subnet_name_prefix  = var.public_subnet_name_prefix
  private_subnet_name_prefix = var.private_subnet_name_prefix
  igw_name                   = var.igw_name
  public_route_table_name    = var.public_route_table_name
}

module "iam" {
  source                = "./modules/iam"
  eks_cluster_role_name = var.eks_cluster_role_name
  eks_node_role_name    = var.eks_node_role_name
}

module "eks" {
  source               = "./modules/eks"
  cluster_name         = var.cluster_name
  node_group_name      = var.node_group_name
  eks_cluster_role_arn = module.iam.eks_cluster_role_arn
  eks_node_role_arn    = module.iam.eks_node_role_arn
  subnet_ids           = module.vpc.public_subnet_ids
  desired_size         = var.desired_size
  max_size             = var.max_size
  min_size             = var.min_size
  instance_types       = var.instance_types
  kubernetes_version   = var.eks_kubernetes_version
}

module "ebs_csi_irsa_role" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name             = "${var.cluster_name}-ebs-csi"
  attach_ebs_csi_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:ebs-csi-controller-sa"]
    }
  }
}

module "eks_blueprints_addons" {
  source  = "aws-ia/eks-blueprints-addons/aws"
  version = "~> 1.0"

  cluster_name      = module.eks.eks_cluster_name
  cluster_endpoint  = module.eks.eks_cluster_endpoint
  cluster_version   = module.eks.cluster_version
  oidc_provider_arn = module.eks.oidc_provider_arn

  eks_addons = {
    aws-ebs-csi-driver = {
      most_recent              = true
      service_account_role_arn = module.ebs_csi_irsa_role.iam_role_arn
    }

    coredns = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
  }
  # enable_metrics_server                  = true
}


resource "aws_iam_openid_connect_provider" "eks_oidc_provider" {
  url = module.eks.oidc_issuer_url

  client_id_list = ["sts.amazonaws.com"]
}

module "argocd" {
  source              = "./modules/argocd"
  namespace           = var.namespace
  release_name        = var.release_name
  chart_repository    = var.chart_repository
  chart_name          = var.chart_name
  chart_version       = var.chart_version
  values_file_path    = var.values_file_path
  helm_timeout        = var.helm_timeout
  depends_on_resource = module.eks
}

module "nginx_ingress" {
  source        = "./modules/nginx_ingress"
  namespace     = var.nginx_namespace
  chart_version = var.nginx_chart_version
  replica_count = var.nginx_replica_count
  service_type  = var.nginx_service_type
  depends_on    = [module.eks]
}

