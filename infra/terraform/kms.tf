resource "aws_kms_key" "main" {
  description             = "${local.name_prefix} platform key"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableRootPermissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowAWSServiceUse"
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "rds.amazonaws.com",
            "s3.amazonaws.com",
            "logs.${var.aws_region}.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowAWSServiceGrantCreation"
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "rds.amazonaws.com",
            "s3.amazonaws.com",
            "logs.${var.aws_region}.amazonaws.com"
          ]
        }
        Action = [
          "kms:CreateGrant"
        ]
        Resource = "*"
        Condition = {
          Bool = {
            "kms:GrantIsForAWSResource" = "true"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-main"
  target_key_id = aws_kms_key.main.key_id
}

data "aws_caller_identity" "current" {}
