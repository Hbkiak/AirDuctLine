$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$port = if ($env:PORT) { $env:PORT } else { "8765" }
$pidFile = Join-Path $projectRoot "logs\office-mes.pid"
$healthUrl = "http://127.0.0.1:$port/api/health"

if (Test-Path $pidFile) {
  $pidText = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $process = if ($pidText) { Get-Process -Id ([int]$pidText) -ErrorAction SilentlyContinue } else { $null }
  if ($process) {
    Write-Host "Process: running. PID: $pidText"
  } else {
    Write-Host "Process: not running, but PID file exists."
  }
} else {
  Write-Host "Process: no PID file."
}

try {
  $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing
  Write-Host "Health: OK ($($response.StatusCode)) $healthUrl"
  Write-Host $response.Content
} catch {
  Write-Host "Health: failed. $healthUrl"
  Write-Host $_.Exception.Message
}
