data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-app-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.ec2_instance_type
  key_name      = var.ec2_key_name

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      encrypted             = true
      volume_size           = 30
      volume_type           = "gp3"
      delete_on_termination = true
    }
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app.id]
    delete_on_termination       = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tftpl", {
    aws_region          = var.aws_region
    project_name        = var.project_name
    environment         = var.environment
    artifact_bucket     = aws_s3_bucket.artifacts.bucket
    artifact_object_key = var.artifact_object_key
    app_port            = var.app_port
    log_group_name      = aws_cloudwatch_log_group.app.name
    db_address          = aws_db_instance.main.address
    db_name             = var.db_name
    db_username         = var.db_username
    db_password         = var.db_password
    app_jwt_secret      = var.app_jwt_secret
    app_allowed_origin_1 = var.app_allowed_origin_1
    app_allowed_origin_2 = var.app_allowed_origin_2
    app_secure_cookies  = var.app_secure_cookies
    app_cookie_same_site = var.app_cookie_same_site
  }))

  tag_specifications {
    resource_type = "instance"

    tags = merge(local.common_tags, {
      Name = "${local.name_prefix}-app-instance"
    })
  }

  tag_specifications {
    resource_type = "volume"

    tags = local.common_tags
  }

  tags = local.common_tags

  depends_on = [aws_s3_object.backend_artifact]
}

resource "aws_lb" "main" {
  name                       = substr(replace("${local.name_prefix}-alb", "/[^a-zA-Z0-9-]/", "-"), 0, 32)
  load_balancer_type         = "application"
  internal                   = true
  enable_deletion_protection = true
  security_groups            = [aws_security_group.alb.id]
  subnets                    = [for subnet in aws_subnet.private_app : subnet.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

resource "aws_lb_target_group" "app" {
  name_prefix = "app"
  port        = var.app_port
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = var.health_check_path
    matcher             = "200-399"
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_lb_listener" "https" {
  count             = local.has_certificate_arn ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_autoscaling_group" "app" {
  name                      = "${local.name_prefix}-app-asg"
  min_size                  = var.min_capacity
  max_size                  = var.max_capacity
  desired_capacity          = var.desired_capacity
  vpc_zone_identifier       = [for subnet in aws_subnet.private_app : subnet.id]
  health_check_type         = "ELB"
  health_check_grace_period = 900
  target_group_arns         = [aws_lb_target_group.app.arn]
  force_delete              = false
  wait_for_capacity_timeout = "20m"

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-app"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags

    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}
