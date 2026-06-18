param(
  [string]$Source = (Split-Path -Parent $PSScriptRoot),
  [Parameter(Mandatory = $true)]
  [string[]]$Destinations,
  [int]$DebounceSeconds = 3,
  [switch]$IncludeRuntimeData
)

$ErrorActionPreference = "Stop"

$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$syncScript = Join-Path $PSScriptRoot "sync-project-copy.ps1"
$lastChange = Get-Date
$pending = $true

function Invoke-ProjectSync {
  $arguments = @{
    Source = $sourcePath
    Destinations = $Destinations
  }
  if ($IncludeRuntimeData) {
    $arguments.IncludeRuntimeData = $true
  }
  & $syncScript @arguments
}

$watcher = [System.IO.FileSystemWatcher]::new($sourcePath)
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]"FileName, DirectoryName, LastWrite, Size"

$ignoredParts = @("\.git\", "\logs\", "\backups\")
if (-not $IncludeRuntimeData) {
  $ignoredParts += @("\uploads\", "\data\", "\exports\")
}

$action = {
  $path = $Event.SourceEventArgs.FullPath
  foreach ($part in $Event.MessageData.IgnoredParts) {
    if ($path -like "*$part*") {
      return
    }
  }
  $Event.MessageData.State.LastChange = Get-Date
  $Event.MessageData.State.Pending = $true
}

$state = [pscustomobject]@{
  LastChange = $lastChange
  Pending = $pending
}
$messageData = [pscustomobject]@{
  State = $state
  IgnoredParts = $ignoredParts
}

$subscriptions = @(
  Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $action -MessageData $messageData
  Register-ObjectEvent -InputObject $watcher -EventName Created -Action $action -MessageData $messageData
  Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $action -MessageData $messageData
  Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $action -MessageData $messageData
)

Write-Host "Watching project changes:"
Write-Host "  Source: $sourcePath"
Write-Host "  Destinations: $($Destinations -join ', ')"
Write-Host "Press Ctrl+C to stop."

try {
  while ($true) {
    Start-Sleep -Milliseconds 500
    if (-not $state.Pending) {
      continue
    }
    $elapsed = (New-TimeSpan -Start $state.LastChange -End (Get-Date)).TotalSeconds
    if ($elapsed -lt $DebounceSeconds) {
      continue
    }
    $state.Pending = $false
    Invoke-ProjectSync
  }
} finally {
  foreach ($subscription in $subscriptions) {
    Unregister-Event -SubscriptionId $subscription.Id -ErrorAction SilentlyContinue
  }
  $watcher.Dispose()
}
