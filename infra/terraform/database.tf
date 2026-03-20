resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnets"
  subnet_ids = [for subnet in aws_subnet.private_db : subnet.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnets"
  })
}

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-postgres"

  engine         = "postgres"
  instance_class  = var.db_instance_class
  db_name        = var.db_name
  username       = var.db_username
  password       = var.db_password
  port           = 5432

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.main.arn

  publicly_accessible   = false
  multi_az              = var.db_multi_az
  deletion_protection    = var.db_deletion_protection
  skip_final_snapshot    = false
  final_snapshot_identifier = "${local.name_prefix}-final-snapshot"
  backup_retention_period   = var.db_backup_retention_days
  auto_minor_version_upgrade = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [aws_security_group.db.id]

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgres"
  })
}
