output "cluster_name" {
  description = "Name of the EKS cluster."
  value       = aws_eks_cluster.stockroom.name
}

output "cluster_endpoint" {
  description = "API endpoint for the EKS cluster."
  value       = aws_eks_cluster.stockroom.endpoint
}

output "vpc_id" {
  description = "ID of the cluster VPC."
  value       = aws_vpc.stockroom.id
}

output "public_subnet_ids" {
  description = "IDs of the two public subnets used by EKS."
  value       = aws_subnet.public[*].id
}

output "configure_kubectl" {
  description = "Command to add this cluster to the local kubeconfig."
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.stockroom.name}"
}
