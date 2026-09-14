import boto3
import time
import base64

s3 = boto3.client('s3', region_name='ap-south-1')
ssm = boto3.client('ssm', region_name='ap-south-1')

bucket = 'smartmark-attendance-bucket'
prefix = 'rahat-temp/'

files = ['app.py', 'requirements.txt', 'index.html', 'style.css', 'script.js']
urls = {}

print("Generating presigned URLs...")
for file in files:
    url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': prefix + file},
        ExpiresIn=3600
    )
    urls[file] = url

script = f"""#!/bin/bash
sudo mkdir -p /home/ubuntu/app
sudo chown -R ubuntu:ubuntu /home/ubuntu/app
cd /home/ubuntu/app

wget -qO app.py "{urls['app.py']}"
wget -qO requirements.txt "{urls['requirements.txt']}"
wget -qO index.html "{urls['index.html']}"
wget -qO style.css "{urls['style.css']}"
wget -qO script.js "{urls['script.js']}"

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
"""

b64_script = base64.b64encode(script.encode('utf-8')).decode('utf-8')

commands = [
    f"echo '{b64_script}' | base64 -d > /tmp/deploy.sh",
    "sudo bash /tmp/deploy.sh"
]

instances = ['i-016cedc921cf5b054', 'i-03abec4a2512f34db']

print("Sending SSM Command...")
response = ssm.send_command(
    DocumentName='AWS-RunShellScript',
    InstanceIds=instances,
    Parameters={'commands': commands}
)

command_id = response['Command']['CommandId']
print(f"Command ID: {command_id}")

print("Waiting for command to complete...")
time.sleep(20)

invocations = ssm.list_command_invocations(
    CommandId=command_id,
    Details=True
)['CommandInvocations']

for inv in invocations:
    print(f"Instance {inv['InstanceId']}: {inv['Status']}")
    if inv.get('CommandPlugins'):
        print(inv['CommandPlugins'][0].get('Output', ''))
