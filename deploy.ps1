$ErrorActionPreference = "Stop"

# Get base64 representation of files
$app_py_b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes(".\app.py"))
$req_b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes(".\requirements.txt"))
$index_b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes(".\index.html"))
$style_b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes(".\style.css"))
$script_b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes(".\script.js"))

# Read the deployment script
$deploy_script = Get-Content -Raw ".\instance_deploy.sh"
# Prepend the env vars to the script
$deploy_script = "export APP_PY_B64=`"$app_py_b64`"`nexport REQ_B64=`"$req_b64`"`nexport INDEX_B64=`"$index_b64`"`nexport STYLE_B64=`"$style_b64`"`nexport SCRIPT_B64=`"$script_b64`"`n" + $deploy_script

# Save it to a local temp file to upload
Set-Content -Path ".\temp_deploy.sh" -Value $deploy_script

# Upload to SSM parameter store (using file to avoid command line length limits)
Write-Host "Uploading deploy script to SSM Parameter Store..."
aws ssm put-parameter --name "/sentinelops/deploy_script" --value file://temp_deploy.sh --type String --overwrite --tier Advanced

# Instance IDs
$instances = "i-016cedc921cf5b054", "i-03abec4a2512f34db"

Write-Host "Triggering deployment..."
aws ssm send-command `
    --document-name "AWS-RunShellScript" `
    --instance-ids $instances `
    --parameters commands=["aws ssm get-parameter --name /sentinelops/deploy_script --with-decryption --query Parameter.Value --output text > /tmp/deploy.sh", "bash /tmp/deploy.sh"] `
    --query "Command.CommandId" `
    --output text

Write-Host "Deployment initiated."


Write-Host "Deployment command sent."
