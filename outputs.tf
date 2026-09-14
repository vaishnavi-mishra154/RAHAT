output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}
output "rds_security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds.id
}
output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.address
}