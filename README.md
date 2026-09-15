# RAHAT: Emergency Response Platform

**RAHAT** is a highly available, disaster-proof Emergency Response Platform built with a multi-region active-passive disaster recovery (DR) architecture on AWS. The infrastructure is entirely codified using Terraform and relies on robust AWS native services to ensure continuous uptime during critical emergencies.

## 🚀 Features & Architecture

- **assets folder is for ui assets** 
- **Multi-Region Disaster Recovery:** Deployed across `ap-south-1` (Mumbai, Active) and `ap-south-2` (Hyderabad, Passive).
- **DNS Failover Routing:** Uses Amazon Route 53 Health Checks to automatically redirect traffic to the secondary region if the primary region goes offline.
- **Cross-Region Database Replication:** Leverages Amazon RDS (MySQL) with asynchronous cross-region Read Replicas to ensure zero data loss.
- **High Availability (Intra-Region):** Uses Application Load Balancers (ALB) and Auto Scaling Groups (ASG) across multiple Availability Zones to heal from individual EC2 instance crashes.
- **Zero-Downtime Blue-Green Deployments:** Deployment script uses AWS Systems Manager (SSM) and S3 presigned URLs for secure, rolling background deployments.

## 🛠️ Technology Stack

- **Cloud Provider:** Amazon Web Services (AWS)
- **Infrastructure as Code (IaC):** Terraform
- **Backend:** Python (Flask), MySQL
- **Frontend:** Vanilla HTML/CSS/JS (Dynamic UI)

## 📁 Repository Structure

- `main.tf`, `vpc.tf`, `variables.tf`: Primary region (Mumbai) infrastructure.
- `secondary.tf`: Secondary region (Hyderabad) disaster recovery infrastructure.
- `app.py`, `requirements.txt`: Python Flask API backend.
- `index.html`, `style.css`, `script.js`: Frontend application assets.
- `deploy.py`: Deployment orchestration script utilizing AWS SSM and S3.

## ⚙️ How to Deploy

1. Initialize Terraform:
   ```bash
   terraform init
   ```
2. Apply the infrastructure (provisions VPCs, ALBs, ASGs, and RDS databases):
   ```bash
   terraform apply
   ```
3. Deploy the application code to EC2 instances using the automated python script:
   ```bash
   python deploy.py
   ```

## 📝 Demonstrations Included

This project includes fully automated disaster simulations designed to demonstrate system resilience:
1. **EC2 Failure Recovery**: Kill a running server and watch the ASG/ALB instantly heal the cluster.
2. **Blue-Green Deployment**: Shift 100% of traffic to a new version without dropping connections.
3. **Regional Outage Failover**: Block traffic to the primary ALB to trigger a Route 53 DNS failover to the secondary region.
4. **Disaster Recovery Database Promotion**: Promote the cross-region Read Replica into a primary writer.
5. **Dynamic Auto-Scaling**: Stress test CPU to trigger CloudWatch Alarms and spawn new EC2 instances.

*(See the included Presentation Notes for defense arguments and full walkthroughs.)*
