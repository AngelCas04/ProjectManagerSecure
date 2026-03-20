variable "project_name" {
  description = "Project name used for resource prefixes."
  type        = string
  default     = "projectmanager"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for the deployment."
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets."
  type        = list(string)
  default     = ["10.20.0.0/24", "10.20.1.0/24"]
}

variable "private_app_subnet_cidrs" {
  description = "CIDR blocks for private application subnets."
  type        = list(string)
  default     = ["10.20.10.0/24", "10.20.11.0/24"]
}

variable "private_db_subnet_cidrs" {
  description = "CIDR blocks for private database subnets."
  type        = list(string)
  default     = ["10.20.20.0/24", "10.20.21.0/24"]
}

variable "allowed_ssh_cidrs" {
  description = "Optional CIDR blocks for SSH access if enabled."
  type        = list(string)
  default     = []
}

variable "enable_ssh" {
  description = "Whether to allow SSH access to the EC2 tier."
  type        = bool
  default     = false
}

variable "ec2_instance_type" {
  description = "Instance type for the application tier."
  type        = string
  default     = "t3.small"
}

variable "ec2_key_name" {
  description = "Optional EC2 key pair name."
  type        = string
  default     = null
}

variable "app_port" {
  description = "Port exposed by the Spring Boot backend."
  type        = number
  default     = 8080
}

variable "health_check_path" {
  description = "Target group health check path."
  type        = string
  default     = "/api/auth/health"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the optional internal HTTPS listener."
  type        = string
  default     = null
}

variable "api_gateway_name" {
  description = "Name of the HTTP API Gateway front door."
  type        = string
  default     = null
}

variable "api_gateway_stage_name" {
  description = "HTTP API stage name. Use $default to keep the public endpoint clean."
  type        = string
  default     = "$default"
}

variable "api_gateway_cors_allow_origins" {
  description = "Explicit origins allowed to call the public HTTPS endpoint."
  type        = list(string)
  default     = ["http://localhost:5173", "http://localhost:4173"]
}

variable "api_gateway_cors_allow_headers" {
  description = "Allowed headers for the HTTP API CORS config."
  type        = list(string)
  default     = ["Content-Type", "X-XSRF-TOKEN", "Authorization"]
}

variable "api_gateway_cors_allow_methods" {
  description = "Allowed methods for the HTTP API CORS config."
  type        = list(string)
  default     = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}

variable "api_gateway_cors_allow_credentials" {
  description = "Whether browsers may send cookies to the public HTTPS endpoint."
  type        = bool
  default     = true
}

variable "desired_capacity" {
  description = "Desired number of EC2 instances."
  type        = number
  default     = 1
}

variable "min_capacity" {
  description = "Minimum number of EC2 instances."
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of EC2 instances."
  type        = number
  default     = 3
}

variable "artifact_bucket_name" {
  description = "Optional custom S3 bucket name for application artifacts."
  type        = string
  default     = null
}

variable "artifact_object_key" {
  description = "Artifact object key used by the EC2 bootstrap script."
  type        = string
  default     = "releases/backend/app.jar"
}

variable "backend_jar_path" {
  description = "Local path to the Spring Boot fat jar to upload to S3."
  type        = string
  default     = "../../backend/spring-api/target/spring-api-0.1.0.jar"
}

variable "db_name" {
  description = "Database name for PostgreSQL."
  type        = string
  default     = "projectmanager"
}

variable "db_username" {
  description = "Master username for PostgreSQL."
  type        = string
  default     = "projectadmin"
}

variable "db_password" {
  description = "Master password for PostgreSQL."
  type        = string
  sensitive   = true
}

variable "app_jwt_secret" {
  description = "JWT secret for the Spring Boot backend."
  type        = string
  sensitive   = true
}

variable "app_allowed_origin_1" {
  description = "Primary frontend origin allowed by backend CORS."
  type        = string
  default     = "https://*.vercel.app"
}

variable "app_allowed_origin_2" {
  description = "Secondary frontend origin allowed by backend CORS."
  type        = string
  default     = "http://localhost:5173"
}

variable "app_secure_cookies" {
  description = "Whether auth cookies should be marked Secure."
  type        = bool
  default     = true
}

variable "app_cookie_same_site" {
  description = "SameSite mode for auth cookies."
  type        = string
  default     = "None"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Initial storage for RDS in GiB."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Autoscaling upper bound for RDS storage in GiB."
  type        = number
  default     = 100
}

variable "db_multi_az" {
  description = "Whether the database is deployed as Multi-AZ."
  type        = bool
  default     = false
}

variable "db_backup_retention_days" {
  description = "RDS backup retention in days."
  type        = number
  default     = 1
}

variable "db_deletion_protection" {
  description = "Protect the database from accidental deletion."
  type        = bool
  default     = true
}

variable "extra_tags" {
  description = "Additional tags to apply to all resources."
  type        = map(string)
  default     = {}
}
