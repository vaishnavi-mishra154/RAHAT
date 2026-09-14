variable "aws_region" {
  description = "AWS region for the primary infrastructure"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "emergency-response"
}
variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}
