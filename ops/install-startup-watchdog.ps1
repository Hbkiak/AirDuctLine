$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$watchScript = Join-Path $projectRoot "ops\watch-office-mes.ps1"
$startupDir = [Environment]::GetFolderPath("Startup")
$cmdPath = Join-Path $startupDir "Office MES Watchdog.cmd"

if (-not (Test-Path -LiteralPath $watchScript)) {
  throw "Watchdog script not found: $watchScript"
}

$content = @"
@echo off
start "Office MES Watchdog" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$watchScript" -Port 8765 -IntervalSeconds 60
"@

Set-Content -LiteralPath $cmdPath -Value $content -Encoding ASCII

Write-Host "Startup watchdog installed:"
Write-Host $cmdPath
Write-Host "It will start Office MES watchdog when this Windows user logs in."
