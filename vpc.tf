resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name    = "${var.project_name}-vpc"
    Project = var.project_name
  }
}
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "${var.project_name}-igw"
    Project = var.project_name
  }
}
resource "aws_subnet" "public_az1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-south-1a"
  map_public_ip_on_launch = true

  tags = {
    Name    = "${var.project_name}-public-az1"
    Tier    = "public"
    Project = var.project_name
  }
}

resource "aws_subnet" "public_az2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "ap-south-1b"
  map_public_ip_on_launch = true

  tags = {
    Name    = "${var.project_name}-public-az2"
    Tier    = "public"
    Project = var.project_name
  }
}

resource "aws_subnet" "app_az1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "ap-south-1a"

  tags = {
    Name    = "${var.project_name}-app-az1"
    Tier    = "private-app"
    Project = var.project_name
  }
}

resource "aws_subnet" "app_az2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "ap-south-1b"

  tags = {
    Name    = "${var.project_name}-app-az2"
    Tier    = "private-app"
    Project = var.project_name
  }
}

resource "aws_subnet" "db_az1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = "ap-south-1a"

  tags = {
    Name    = "${var.project_name}-db-az1"
    Tier    = "private-db"
    Project = var.project_name
  }
}

resource "aws_subnet" "db_az2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.22.0/24"
  availability_zone = "ap-south-1b"

  tags = {
    Name    = "${var.project_name}-db-az2"
    Tier    = "private-db"
    Project = var.project_name
  }
}
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name    = "${var.project_name}-public-rt"
    Project = var.project_name
  }
}

resource "aws_route_table" "private_app_az1" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "${var.project_name}-private-app-az1-rt"
    Project = var.project_name
  }
}

resource "aws_route_table" "private_app_az2" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "${var.project_name}-private-app-az2-rt"
    Project = var.project_name
  }
}

resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "${var.project_name}-private-db-rt"
    Project = var.project_name
  }
}
resource "aws_route_table_association" "public_az1" {
  subnet_id      = aws_subnet.public_az1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_az2" {
  subnet_id      = aws_subnet.public_az2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "app_az1" {
  subnet_id      = aws_subnet.app_az1.id
  route_table_id = aws_route_table.private_app_az1.id
}

resource "aws_route_table_association" "app_az2" {
  subnet_id      = aws_subnet.app_az2.id
  route_table_id = aws_route_table.private_app_az2.id
}

resource "aws_route_table_association" "db_az1" {
  subnet_id      = aws_subnet.db_az1.id
  route_table_id = aws_route_table.private_db.id
}

resource "aws_route_table_association" "db_az2" {
  subnet_id      = aws_subnet.db_az2.id
  route_table_id = aws_route_table.private_db.id
}
resource "aws_eip" "nat_az1" {
  domain = "vpc"

  tags = {
    Name    = "${var.project_name}-nat-eip-az1"
    Project = var.project_name
  }
}

resource "aws_eip" "nat_az2" {
  domain = "vpc"

  tags = {
    Name    = "${var.project_name}-nat-eip-az2"
    Project = var.project_name
  }
}
resource "aws_nat_gateway" "az1" {
  allocation_id = aws_eip.nat_az1.id
  subnet_id     = aws_subnet.public_az1.id

  depends_on = [
    aws_internet_gateway.main
  ]

  tags = {
    Name    = "${var.project_name}-nat-az1"
    Project = var.project_name
  }
}

resource "aws_nat_gateway" "az2" {
  allocation_id = aws_eip.nat_az2.id
  subnet_id     = aws_subnet.public_az2.id

  depends_on = [
    aws_internet_gateway.main
  ]

  tags = {
    Name    = "${var.project_name}-nat-az2"
    Project = var.project_name
  }
}
resource "aws_route" "private_app_az1_nat" {
  route_table_id         = aws_route_table.private_app_az1.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.az1.id
}

resource "aws_route" "private_app_az2_nat" {
  route_table_id         = aws_route_table.private_app_az2.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.az2.id
}
