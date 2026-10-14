# AWS EKS infrastructure

This Terraform configuration creates a demo VPC with two public subnets in separate Availability Zones, an internet gateway and route table, an EKS control plane, and a managed node group. AWS credentials are read through the standard AWS provider chain (for example, an AWS profile or environment credentials); no credentials belong in Terraform files.

## Prerequisites

- Terraform 1.6 or newer
- AWS CLI credentials with permission to create and delete VPC, IAM, EKS, and EC2 resources
- An AWS region with at least two available Availability Zones and EKS support

## Plan and deploy

From this directory:

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt -check
terraform validate
terraform plan -out=stockroom.tfplan
terraform apply stockroom.tfplan
```

Review the plan before applying. EKS control planes and EC2 worker nodes incur AWS charges while running. The defaults create two `t3.medium` worker nodes; adjust the sizes and instance type in `terraform.tfvars` to match the demo budget and region.

After applying, use the `configure_kubectl` output to configure `kubectl`, then review cluster details with `terraform output` and `aws eks describe-nodegroup`.

## Tear down

When finished with the AWS demo, remove the managed node group and cluster, then the network and IAM resources:

```bash
terraform destroy
```

Confirm the destroy plan before approving it. Terraform state files and local `terraform.tfvars` are ignored by Git; the example variables file is safe to commit and contains no credentials.
