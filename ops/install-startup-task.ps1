$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$taskName = "Office MES Server"
$scriptPath = Join-Path $projectRoot "ops\start-office-mes.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Start Office MES internal web server at user logon." -Force | Out-Null

Write-Host "Startup task installed: $taskName"
Write-Host "It will run at Windows logon and start Office MES from:"
Write-Host $scriptPath
