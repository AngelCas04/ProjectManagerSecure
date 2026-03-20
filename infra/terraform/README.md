# Terraform Baseline

This folder contains a security-focused AWS baseline for the Project Manager platform.

## What It Creates

- VPC with public and private subnets across multiple AZs
- Internet gateway, NAT gateway, and route tables
- Internal ALB in private subnets
- HTTP API Gateway front door using the default `execute-api` HTTPS endpoint
- EC2 application tier in private subnets behind the ALB
- Private PostgreSQL RDS instance
- S3 bucket for application artifacts and updates
- IAM role and instance profile for EC2
- KMS key for storage encryption
- CloudWatch log group for application logs

## Security Posture

- RDS is not publicly accessible
- EC2 instances have no public IP addresses
- ALB is internal and only reachable from the API Gateway VPC Link
- S3 bucket blocks public access and requires TLS
- Security groups restrict traffic between API Gateway, ALB, app tier, and database
- IAM permissions are scoped to the artifact bucket, KMS key, SSM, and CloudWatch Logs
- Secrets are provided through variables, not hardcoded
- EC2 enforces IMDSv2 and encrypted root volumes
- VPC Flow Logs are enabled for audit and incident response

## Prerequisites

- Terraform 1.6+
- AWS credentials with permissions to create VPC, EC2, RDS, IAM, KMS, S3, ALB, API Gateway, and CloudWatch resources
- A strong PostgreSQL password

## Usage

```bash
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

Use `terraform.tfvars.example` as a starting point.

## Important Notes

- The EC2 bootstrap script expects a Spring Boot fat jar at `artifact_object_key` in the S3 bucket.
- The backend should expose a health endpoint compatible with `health_check_path`.
- The public browser endpoint is the API Gateway `execute-api` URL from `api_gateway_endpoint`.
- If your frontend is deployed on Vercel, add its exact origin to `api_gateway_cors_allow_origins` before applying so browser requests can include cookies.
- If you want SSH access, set `enable_ssh = true` and provide `allowed_ssh_cidrs`.
- For production, pin the AMI or move to a golden-image pipeline.
