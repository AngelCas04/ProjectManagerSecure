resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/${local.name_prefix}/app"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "vpc_flow" {
  name              = "/aws/vpc/${local.name_prefix}/flow"
  retention_in_days = 30

  tags = local.common_tags
}

data "aws_iam_policy_document" "vpc_flow_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "vpc_flow" {
  name               = "${local.name_prefix}-vpc-flow-role"
  assume_role_policy = data.aws_iam_policy_document.vpc_flow_assume_role.json

  tags = local.common_tags
}

data "aws_iam_policy_document" "vpc_flow_logs" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "vpc_flow" {
  name   = "${local.name_prefix}-vpc-flow"
  role   = aws_iam_role.vpc_flow.id
  policy = data.aws_iam_policy_document.vpc_flow_logs.json
}

resource "aws_flow_log" "main" {
  log_destination_type = "cloud-watch-logs"
  log_group_name       = aws_cloudwatch_log_group.vpc_flow.name
  iam_role_arn         = aws_iam_role.vpc_flow.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
}
