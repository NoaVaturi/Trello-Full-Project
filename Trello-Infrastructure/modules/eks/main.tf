resource "aws_eks_cluster" "trello_cluster" {
  name     = var.cluster_name
  role_arn = var.eks_cluster_role_arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids = var.subnet_ids
  }

  depends_on = [
    var.eks_cluster_role_arn
  ]
}

resource "aws_eks_node_group" "trello_nodes" {
  cluster_name    = aws_eks_cluster.trello_cluster.name
  node_group_name = var.node_group_name
  node_role_arn   = var.eks_node_role_arn
  subnet_ids      = var.subnet_ids

  scaling_config {
    desired_size = var.desired_size
    max_size     = var.max_size
    min_size     = var.min_size
  }

  instance_types = var.instance_types

  depends_on = [
    aws_eks_cluster.trello_cluster
  ]
}

