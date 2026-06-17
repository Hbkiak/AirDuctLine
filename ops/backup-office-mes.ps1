$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $projectRoot "data"
$uploadDir = Join-Path $projectRoot "uploads"
$backupRoot = Join-Path $projectRoot "backups"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $backupRoot $stamp

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

if (Test-Path $dataDir) {
  Copy-Item -Path $dataDir -Destination (Join-Path $backupDir "data") -Recurse -Force
}

if (Test-Path $uploadDir) {
  Copy-Item -Path $uploadDir -Destination (Join-Path $backupDir "uploads") -Recurse -Force
}

$zipPath = Join-Path $backupRoot "office-mes-$stamp.zip"
Compress-Archive -Path (Join-Path $backupDir "*") -DestinationPath $zipPath -Force

Write-Host "Backup created: $zipPath"
