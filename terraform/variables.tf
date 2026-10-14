variable "aws_region" {
  description = "AWS region where the Stockroom EKS cluster will be created."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Short prefix used for AWS resource names."
  type        = string
  default     = "stockroom"
}

variable "environment" {
  description = "Environment label applied to created resources."
  type        = string
  default     = "demo"
}

variable "vpc_cidr" {
  description = "IPv4 CIDR range for the EKS VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Two public subnet CIDRs, one in each of two availability zones."
  type        = list(string)
  default     = ["10.20.1.0/24", "10.20.2.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == 2
    error_message = "Exactly two public subnet CIDRs are required for the demo cluster."
  }
}

variable "node_instance_type" {
  description = "EC2 instance type for the EKS managed node group."
  type        = string
  default     = "t3.medium"
}

variable "node_desired_size" {
  description = "Desired number of EKS worker nodes."
  type        = number
  default     = 2

  validation {
    condition     = var.node_desired_size >= var.node_min_size && var.node_desired_size <= var.node_max_size
    error_message = "node_desired_size must be between node_min_size and node_max_size."
  }
}

variable "node_min_size" {
  description = "Minimum number of EKS worker nodes."
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum number of EKS worker nodes."
  type        = number
  default     = 3
}
