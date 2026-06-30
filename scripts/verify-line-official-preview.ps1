$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$html = Join-Path $root "line-official-preview.html"
$css = Join-Path $root "line-official-preview.css"
$js = Join-Path $root "line-official-preview.js"

foreach ($file in @($html, $css, $js)) {
  if (-not (Test-Path -LiteralPath $file)) {
    throw "Missing required preview file: $file"
  }
}

$htmlText = Get-Content -LiteralPath $html -Raw -Encoding UTF8
$cssText = Get-Content -LiteralPath $css -Raw -Encoding UTF8
$jsText = Get-Content -LiteralPath $js -Raw -Encoding UTF8

$requiredHtml = @(
  'id="chatScreen"',
  'id="liffScreen"',
  'class="rich-menu-grid"',
  'data-view="create"',
  'data-view="my"',
  'data-view="notify"',
  'data-view="dashboard"',
  'data-view="docs"',
  'data-view="admin"'
)

foreach ($needle in $requiredHtml) {
  if (-not $htmlText.Contains($needle)) {
    throw "HTML preview is missing marker: $needle"
  }
}

$requiredCss = @(
  ".phone-frame",
  ".rich-menu-grid",
  ".chat-bubble",
  ".liff-panel"
)

foreach ($needle in $requiredCss) {
  if (-not $cssText.Contains($needle)) {
    throw "CSS preview is missing selector: $needle"
  }
}

$requiredJs = @(
  "renderChat",
  "renderLiff",
  "richMenuButtons",
  "createJobCard"
)

foreach ($needle in $requiredJs) {
  if (-not $jsText.Contains($needle)) {
    throw "JS preview is missing behavior: $needle"
  }
}

"line-official-preview verification passed"
