$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $projectRoot "logs"
$pidFile = Join-Path $logDir "office-mes.pid"

if (-not (Test-Path $pidFile)) {
  Write-Host "Office MES PID file was not found."
  exit 0
}

$pidText = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $pidText) {
  Remove-Item -Path $pidFile -Force
  Write-Host "Office MES PID file was empty and has been removed."
  exit 0
}

$process = Get-Process -Id ([int]$pidText) -ErrorAction SilentlyContinue
if ($process) {
  Stop-Process -Id $process.Id
  Write-Host "Office MES stopped. PID: $($process.Id)"
} else {
  Write-Host "Office MES process was not running. PID: $pidText"
}

Start-Sleep -Milliseconds 300
try {
  Remove-Item -Path $pidFile -Force -ErrorAction Stop
} catch {
  Write-Host "Could not remove PID file. It can be overwritten by the next start."
}
