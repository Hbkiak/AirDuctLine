$ErrorActionPreference = "Stop"

$port = if ($env:PORT) { $env:PORT } else { "8765" }
try {
  $addresses = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254.*" -and
      $_.PrefixOrigin -ne "WellKnown"
    } |
    Select-Object -ExpandProperty IPAddress
} catch {
  $addresses = (ipconfig | Select-String "IPv4").Line |
    ForEach-Object { ($_ -split ":", 2)[1].Trim() } |
    Where-Object { $_ -and $_ -notlike "127.*" -and $_ -notlike "169.254.*" }
}

if (-not $addresses) {
  Write-Host "No LAN IPv4 address found. Check network connection."
  exit 1
}

Write-Host "Office MES LAN URLs:"
$addresses | ForEach-Object {
  Write-Host "http://$($_):$port/"
}
