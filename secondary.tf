# -----------------------------
# Secondary VPC Network (ap-south-2)
# -----------------------------
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name    = "${var.project_name}-secondary-vpc"
    Project = var.project_name
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name    = "${var.project_name}-secondary-igw"
    Project = var.project_name
  }
}

resource "aws_subnet" "sec_public_az1" {
  provider                = aws.secondary
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = "ap-south-2a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "sec_public_az2" {
  provider                = aws.secondary
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.2.0/24"
  availability_zone       = "ap-south-2b"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "sec_app_az1" {
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.11.0/24"
  availability_zone = "ap-south-2a"
}

resource "aws_subnet" "sec_app_az2" {
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.12.0/24"
  availability_zone = "ap-south-2b"
}

resource "aws_subnet" "sec_db_az1" {
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.21.0/24"
  availability_zone = "ap-south-2a"
}

resource "aws_subnet" "sec_db_az2" {
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.22.0/24"
  availability_zone = "ap-south-2b"
}

resource "aws_route_table" "sec_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
}

resource "aws_route_table_association" "sec_pub1" {
  provider       = aws.secondary
  subnet_id      = aws_subnet.sec_public_az1.id
  route_table_id = aws_route_table.sec_public.id
}
resource "aws_route_table_association" "sec_pub2" {
  provider       = aws.secondary
  subnet_id      = aws_subnet.sec_public_az2.id
  route_table_id = aws_route_table.sec_public.id
}

resource "aws_eip" "sec_nat_eip" {
  provider = aws.secondary
  domain   = "vpc"
}

resource "aws_nat_gateway" "sec_nat" {
  provider      = aws.secondary
  allocation_id = aws_eip.sec_nat_eip.id
  subnet_id     = aws_subnet.sec_public_az1.id
}

resource "aws_route_table" "sec_private" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.sec_nat.id
  }
}

resource "aws_route_table_association" "sec_app1" {
  provider       = aws.secondary
  subnet_id      = aws_subnet.sec_app_az1.id
  route_table_id = aws_route_table.sec_private.id
}
resource "aws_route_table_association" "sec_app2" {
  provider       = aws.secondary
  subnet_id      = aws_subnet.sec_app_az2.id
  route_table_id = aws_route_table.sec_private.id
}

# -----------------------------
# Secondary Security Groups
# -----------------------------
resource "aws_security_group" "sec_alb_sg" {
  provider    = aws.secondary
  name        = "${var.project_name}-sec-alb-sg"
  vpc_id      = aws_vpc.secondary.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16"]
  }
}

resource "aws_security_group" "sec_ec2_sg" {
  provider = aws.secondary
  name     = "${var.project_name}-sec-ec2-sg"
  vpc_id   = aws_vpc.secondary.id
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.sec_alb_sg.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "sec_rds_sg" {
  provider = aws.secondary
  name     = "${var.project_name}-sec-rds-sg"
  vpc_id   = aws_vpc.secondary.id
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.sec_ec2_sg.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# -----------------------------
# Secondary RDS Read Replica (Demo 4)
# -----------------------------
resource "aws_db_subnet_group" "secondary" {
  provider = aws.secondary
  name     = "${var.project_name}-sec-db-subnet-group"
  subnet_ids = [
    aws_subnet.sec_db_az1.id,
    aws_subnet.sec_db_az2.id
  ]
}

# resource "aws_db_instance" "replica" {
#   provider               = aws.secondary
#   identifier             = "${var.project_name}-db-replica"
#   replicate_source_db    = aws_db_instance.main.arn
#   instance_class         = "db.t3.micro"
#   vpc_security_group_ids = [aws_security_group.sec_rds_sg.id]
#   skip_final_snapshot    = true
#   multi_az               = false
#   publicly_accessible    = false
#   db_subnet_group_name   = aws_db_subnet_group.secondary.name
#
#   tags = {
#     Name = "${var.project_name}-replica-rds"
#   }
# }

# -----------------------------
# Secondary Application (ALB & ASG)
# -----------------------------
resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "${var.project_name}-sec-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.sec_alb_sg.id]
  subnets            = [aws_subnet.sec_public_az1.id, aws_subnet.sec_public_az2.id]
}

resource "aws_lb_target_group" "sec_tg" {
  provider = aws.secondary
  name     = "${var.project_name}-sec-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id
  target_type = "instance"
  health_check {
    path    = "/api/health"
    matcher = "200"
  }
}

resource "aws_lb_listener" "sec_http" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.sec_tg.arn
  }
}

# Find latest Ubuntu AMI in secondary region
data "aws_ami" "sec_ubuntu" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["099720109477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_launch_template" "sec_app" {
  provider      = aws.secondary
  name_prefix   = "${var.project_name}-sec-app-"
  image_id      = data.aws_ami.sec_ubuntu.id
  instance_type = "t3.micro"
  vpc_security_group_ids = [aws_security_group.sec_ec2_sg.id]

  iam_instance_profile {
    # Using the same IAM instance profile name from primary (IAM is global)
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
  #!/bin/bash
  set -e
  apt-get update -y
  apt-get install -y python3 curl awscli
  # Wait for deployment via SSM just like primary!
EOF
  )
}

resource "aws_autoscaling_group" "sec_app" {
  provider            = aws.secondary
  name                = "${var.project_name}-sec-asg"
  min_size            = 2
  max_size            = 4
  desired_capacity    = 2
  vpc_zone_identifier = [aws_subnet.sec_app_az1.id, aws_subnet.sec_app_az2.id]
  target_group_arns   = [aws_lb_target_group.sec_tg.arn]
  health_check_type   = "ELB"

  launch_template {
    id      = aws_launch_template.sec_app.id
    version = "$Latest"
  }
}

# -----------------------------
# Route 53 Regional Failover (Demo 3)
# -----------------------------
resource "aws_route53_zone" "demo" {
  name = "rahat-failover-demo.com"
  comment = "Demo Hosted Zone for Regional Failover testing"
}

resource "aws_route53_health_check" "primary" {
  fqdn              = aws_lb.main.dns_name
  port              = 80
  type              = "HTTP"
  resource_path     = "/api/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = {
    Name = "primary-alb-health-check"
  }
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.demo.zone_id
  name    = "app.rahat-failover-demo.com"
  type    = "CNAME"
  ttl     = 60
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  set_identifier  = "primary"
  health_check_id = aws_route53_health_check.primary.id
  records         = [aws_lb.main.dns_name]
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.demo.zone_id
  name    = "app.rahat-failover-demo.com"
  type    = "CNAME"
  ttl     = 60
  
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  set_identifier = "secondary"
  records        = [aws_lb.secondary.dns_name]
}
