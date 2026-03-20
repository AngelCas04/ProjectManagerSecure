output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = [for subnet in aws_subnet.public : subnet.id]
}

output "private_app_subnet_ids" {
  value = [for subnet in aws_subnet.private_app : subnet.id]
}

output "private_db_subnet_ids" {
  value = [for subnet in aws_subnet.private_db : subnet.id]
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "alb_arn" {
  value = aws_lb.main.arn
}

output "api_gateway_id" {
  value = aws_apigatewayv2_api.main.id
}

output "api_gateway_endpoint" {
  value = aws_apigatewayv2_api.main.api_endpoint
}

output "api_gateway_stage" {
  value = aws_apigatewayv2_stage.main.name
}

output "api_gateway_vpc_link_id" {
  value = aws_apigatewayv2_vpc_link.main.id
}

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "app_security_group_id" {
  value = aws_security_group.app.id
}

output "db_security_group_id" {
  value = aws_security_group.db.id
}

output "app_target_group_arn" {
  value = aws_lb_target_group.app.arn
}

output "artifact_bucket_name" {
  value = aws_s3_bucket.artifacts.bucket
}

output "db_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "db_address" {
  value = aws_db_instance.main.address
}

output "ec2_role_arn" {
  value = aws_iam_role.ec2.arn
}

output "cloudwatch_log_group" {
  value = aws_cloudwatch_log_group.app.name
}

output "vpc_flow_log_group" {
  value = aws_cloudwatch_log_group.vpc_flow.name
}

output "api_gateway_log_group" {
  value = aws_cloudwatch_log_group.api_gateway.name
}
