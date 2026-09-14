$ErrorActionPreference = "Stop"

Write-Host "Generating presigned URLs..."
$url_app = (aws s3 presign s3://smartmark-attendance-bucket/rahat-temp/app.py --expires-in 3600)
$url_req = (aws s3 presign s3://smartmark-attendance-bucket/rahat-temp/requirements.txt --expires-in 3600)
$url_index = (aws s3 presign s3://smartmark-attendance-bucket/rahat-temp/index.html --expires-in 3600)
$url_style = (aws s3 presign s3://smartmark-attendance-bucket/rahat-temp/style.css --expires-in 3600)
$url_script = (aws s3 presign s3://smartmark-attendance-bucket/rahat-temp/script.js --expires-in 3600)

$script = @"
sudo mkdir -p /home/ubuntu/app
sudo chown -R ubuntu:ubuntu /home/ubuntu/app
cd /home/ubuntu/app

wget -qO app.py "$url_app"
wget -qO requirements.txt "$url_req"
wget -qO index.html "$url_index"
wget -qO style.css "$url_style"
wget -qO script.js "$url_script"

sudo apt-get update && sudo apt-get install -y python3-pip python3-venv
python3 -m venv venv
./venv/bin/pip install -r requirements.txt

cat << 'EOF' | sudo tee /etc/systemd/system/rahat.service
[Unit]
Description=RAHAT Flask Application
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/app
Environment=PATH=/home/ubuntu/app/venv/bin
Environment=DB_HOST=emergency-response-db.cl0ms62ioflt.ap-south-1.rds.amazonaws.com
Environment=DB_NAME=emergencydb
Environment=DB_USER=admin
Environment=DB_PASSWORD=YOUR_DB_PASSWORD
ExecStart=/home/ubuntu/app/venv/bin/python /home/ubuntu/app/app.py
Restart=always
StandardOutput=append:/var/log/rahat-api.log
StandardError=append:/var/log/rahat-api.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable rahat.service
sudo systemctl restart rahat.service
sudo systemctl status rahat.service --no-pager
"@

Set-Content -Path ".\temp_deploy.sh" -Value $script

# Upload to SSM parameter store
Write-Host "Uploading deploy script to SSM Parameter Store..."
aws ssm put-parameter --name "/rahat/deploy_script" --value file://temp_deploy.sh --type String --overwrite

$instances = "i-016cedc921cf5b054", "i-03abec4a2512f34db"

Write-Host "Triggering deployment..."
aws ssm send-command `
    --document-name "AWS-RunShellScript" `
    --instance-ids $instances `
    --parameters commands=["aws ssm get-parameter --name /rahat/deploy_script --with-decryption --query Parameter.Value --output text > /tmp/deploy.sh", "bash /tmp/deploy.sh"] `
    --query "Command.CommandId" `
    --output text

Write-Host "Deployment initiated."
