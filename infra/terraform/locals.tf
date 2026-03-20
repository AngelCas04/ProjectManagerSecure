locals {
  name_prefix = "${var.project_name}-${var.environment}"
  has_certificate_arn = var.certificate_arn != null ? trimspace(var.certificate_arn) != "" : false

  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Layer       = "platform"
    },
    var.extra_tags
  )

  azs = data.aws_availability_zones.available.names
}

data "aws_availability_zones" "available" {
  state = "available"
}
