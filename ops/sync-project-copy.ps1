param(
  [string]$Source = (Split-Path -Parent $PSScriptRoot),
  [Parameter(Mandatory = $true)]
  [string[]]$Destinations,
  [switch]$IncludeRuntimeData
)

$ErrorActionPreference = "Stop"

$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$excludeDirs = @(".git", "logs", "backups")
$excludeFiles = @("*.pid")

if (-not $IncludeRuntimeData) {
  $excludeDirs += @("uploads", "data", "exports")
}

foreach ($destination in $Destinations) {
  if ([string]::IsNullOrWhiteSpace($destination)) {
    continue
  }

  $destinationPath = $destination.Trim()
  New-Item -ItemType Directory -Force -Path $destinationPath | Out-Null
  $resolvedDestination = (Resolve-Path -LiteralPath $destinationPath).Path

  if ($resolvedDestination.TrimEnd("\") -ieq $sourcePath.TrimEnd("\")) {
    Write-Host "Skip same source/destination: $resolvedDestination"
    continue
  }

  Write-Host "Syncing:"
  Write-Host "  From: $sourcePath"
  Write-Host "  To:   $resolvedDestination"

  $args = @(
    $sourcePath,
    $resolvedDestination,
    "/E",
    "/COPY:DAT",
    "/DCOPY:DAT",
    "/R:2",
    "/W:2",
    "/NP",
    "/NFL",
    "/NDL"
  )

  if ($excludeDirs.Count) {
    $args += "/XD"
    $args += $excludeDirs
  }

  if ($excludeFiles.Count) {
    $args += "/XF"
    $args += $excludeFiles
  }

  & robocopy @args | Out-Host
  $exitCode = $LASTEXITCODE
  if ($exitCode -ge 8) {
    throw "Robocopy failed with exit code $exitCode"
  }
}

Write-Host "Sync complete."
