$ErrorActionPreference = "Stop"

$taskName = "Office MES Server"
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if (-not $task) {
  Write-Host "Startup task not found: $taskName"
  exit 0
}

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Host "Startup task removed: $taskName"
