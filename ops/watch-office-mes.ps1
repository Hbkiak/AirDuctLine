param(
  [int]$Port = 8765,
  [int]$IntervalSeconds = 60
)

$ErrorActionPreference = "Continue"

$projectRoot = Split-Path -Parent $PSScriptRoot
$startScript = Join-Path $PSScriptRoot "start-office-mes.ps1"
$logDir = Join-Path $projectRoot "logs"
$logFile = Join-Path $logDir "office-mes-watchdog.log"
$lockFile = Join-Path $logDir "office-mes-watchdog.lock"
$healthUrl = "http://127.0.0.1:$Port/api/health"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-WatchLog {
  param([string]$Message)
  $line = "{0} {1}" -f (Get-Date).ToString("s"), $Message
  Add-Content -LiteralPath $logFile -Value $line
}

if (Test-Path -LiteralPath $lockFile) {
  $existingPid = Get-Content -LiteralPath $lockFile -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($existingPid -and (Get-Process -Id ([int]$existingPid) -ErrorAction SilentlyContinue)) {
    Write-WatchLog "watchdog already running. pid=$existingPid"
    exit 0
  }
}

Set-Content -LiteralPath $lockFile -Value $PID
Write-WatchLog "watchdog started. health=$healthUrl interval=${IntervalSeconds}s"

while ($true) {
  try {
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
      Start-Sleep -Seconds $IntervalSeconds
      continue
    }
    Write-WatchLog "health returned status $($response.StatusCode); restarting"
  } catch {
    Write-WatchLog "health failed: $($_.Exception.Message); restarting"
  }

  try {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $startScript | Out-String | ForEach-Object {
      if ($_.Trim()) { Write-WatchLog $_.Trim() }
    }
  } catch {
    Write-WatchLog "restart failed: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds $IntervalSeconds
}
