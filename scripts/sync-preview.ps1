param(
  [string]$Source = "C:\Users\manue\Downloads\portfolio-preview.jsx",
  [string]$Destination = "src\components\PortfolioPreview.jsx"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Source)) {
  throw "No existe el archivo fuente: $Source"
}

$sourceUtf8 = Get-Content -Raw -Encoding UTF8 -LiteralPath $Source
$sourceDefault = Get-Content -Raw -Encoding Default -LiteralPath $Source

function Get-MojibakeScore([string]$text) {
  return ([regex]::Matches($text, 'Ã|Â|�').Count)
}

$scoreUtf8 = Get-MojibakeScore $sourceUtf8
$scoreDefault = Get-MojibakeScore $sourceDefault
$sourceText = if ($scoreUtf8 -le $scoreDefault) { $sourceUtf8 } else { $sourceDefault }

if (-not $sourceText.StartsWith("'use client';")) {
  $sourceText = "'use client';`r`n`r`n" + $sourceText
}

if (-not $sourceText.StartsWith("/* eslint-disable */")) {
  $sourceText = "/* eslint-disable */`r`n" + $sourceText
}

# Keep project visual customizations after sync
$sourceText = $sourceText.Replace(
  '.acc-dk{background:linear-gradient(90deg,#fff 0%,#5ec4c8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-dk{background:linear-gradient(92deg,#def6ef 0%,#a9d7dc 48%,#5e8fb8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}'
)

$sourceText = $sourceText.Replace(
  '.acc-lt{background:linear-gradient(90deg,#1d1d1f 0%,#0e6b6b 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-lt{background:linear-gradient(92deg,#9acbd2 0%,#75aec0 50%,#527ea6 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}'
)

$sourceText = $sourceText.Replace(
  'border:`1px solid ${isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)"}`,borderTop:"none"',
  'borderStyle:"solid",borderColor:isDark?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)",borderWidth:"0 1px 1px 1px"'
)

$destinationDir = Split-Path -Parent $Destination
if ($destinationDir -and -not (Test-Path -LiteralPath $destinationDir)) {
  New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
}

$destinationFullPath = [System.IO.Path]::GetFullPath($Destination)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($destinationFullPath, $sourceText, $utf8NoBom)

Write-Output "Preview sincronizado en: $destinationFullPath"
Write-Output "Mojibake score UTF8=$scoreUtf8, Default=$scoreDefault"
