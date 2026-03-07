param(
  [string]$Source = "C:\Users\manue\Downloads\portfolio-preview.jsx",
  [string]$Destination = "src\components\PortfolioPreview.jsx"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Source)) {
  throw "No existe el archivo fuente: $Source"
}

$sourceText = Get-Content -Raw -LiteralPath $Source

if (-not $sourceText.StartsWith("'use client';")) {
  $sourceText = "'use client';`r`n`r`n" + $sourceText
}

if (-not $sourceText.StartsWith("/* eslint-disable */")) {
  $sourceText = "/* eslint-disable */`r`n" + $sourceText
}

$destinationDir = Split-Path -Parent $Destination
if ($destinationDir -and -not (Test-Path -LiteralPath $destinationDir)) {
  New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
}

$destinationFullPath = [System.IO.Path]::GetFullPath($Destination)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($destinationFullPath, $sourceText, $utf8NoBom)

Write-Output "Preview sincronizado en: $destinationFullPath"
