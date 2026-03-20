resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}/http-api"
  retention_in_days = 30

  tags = local.common_tags
}

resource "aws_apigatewayv2_api" "main" {
  name          = coalesce(var.api_gateway_name, "${local.name_prefix}-http-api")
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = var.api_gateway_cors_allow_credentials
    allow_headers     = var.api_gateway_cors_allow_headers
    allow_methods     = var.api_gateway_cors_allow_methods
    allow_origins     = var.api_gateway_cors_allow_origins
    max_age           = 3600
  }

  tags = local.common_tags
}

resource "aws_apigatewayv2_vpc_link" "main" {
  name               = "${local.name_prefix}-http-vpc-link"
  subnet_ids         = [for subnet in aws_subnet.private_app : subnet.id]
  security_group_ids = [aws_security_group.apigw_vpc_link.id]

  tags = local.common_tags
}

resource "aws_apigatewayv2_integration" "alb" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "HTTP_PROXY"
  integration_method     = "ANY"
  connection_type        = "VPC_LINK"
  connection_id          = aws_apigatewayv2_vpc_link.main.id
  integration_uri        = aws_lb_listener.http.arn
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.alb.id}"
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.api_gateway_stage_name
  auto_deploy = true
  depends_on  = [aws_apigatewayv2_route.default]

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId  = "$context.requestId"
      ip         = "$context.identity.sourceIp"
      requestTime = "$context.requestTime"
      routeKey   = "$context.routeKey"
      status     = "$context.status"
      responseLength = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }

  tags = local.common_tags
}
