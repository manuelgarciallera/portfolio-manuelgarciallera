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
  $pattern = '[\u00C3\u00C2\uFFFD]|\u00E2[\u0080-\u00BF]|\u00EF\u00BB\u00BF'
  return ([regex]::Matches($text, $pattern).Count)
}

function Repair-Mojibake([string]$text) {
  $cp1252 = [System.Text.Encoding]::GetEncoding(1252)
  $bytes = $cp1252.GetBytes($text)
  return [System.Text.Encoding]::UTF8.GetString($bytes)
}

$sourceUtf8Repaired = Repair-Mojibake $sourceUtf8
$sourceDefaultRepaired = Repair-Mojibake $sourceDefault

$candidates = @(
  [pscustomobject]@{ Name = 'UTF8'; Text = $sourceUtf8; Score = (Get-MojibakeScore $sourceUtf8) },
  [pscustomobject]@{ Name = 'Default'; Text = $sourceDefault; Score = (Get-MojibakeScore $sourceDefault) },
  [pscustomobject]@{ Name = 'UTF8Repaired'; Text = $sourceUtf8Repaired; Score = (Get-MojibakeScore $sourceUtf8Repaired) },
  [pscustomobject]@{ Name = 'DefaultRepaired'; Text = $sourceDefaultRepaired; Score = (Get-MojibakeScore $sourceDefaultRepaired) }
)

$bestCandidate = $candidates[0]
for ($i = 1; $i -lt $candidates.Count; $i++) {
  if ($candidates[$i].Score -lt $bestCandidate.Score) {
    $bestCandidate = $candidates[$i]
  }
}

$sourceText = $bestCandidate.Text

if (-not $sourceText.StartsWith("'use client';")) {
  $sourceText = "'use client';`r`n`r`n" + $sourceText
}

if (-not $sourceText.StartsWith("/* eslint-disable */")) {
  $sourceText = "/* eslint-disable */`r`n" + $sourceText
}

# Persist project-specific visual and compatibility fixes after sync.
$accDkFinal = '.acc-dk{background:linear-gradient(92deg,#ffffff 0%,#ffffff 7%,#bde3de 19%,#96c8ce 42%,#6ea8bc 70%,#49759d 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}'
$accLtFinal = '.acc-lt{background:linear-gradient(92deg,#a5ced3 0%,#a5ced3 7%,#88b5c2 34%,#668fa6 66%,#3f648a 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}'

$accDkVariants = @(
  '.acc-dk{background:linear-gradient(90deg,#fff 0%,#5ec4c8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-dk{background:linear-gradient(92deg,#b8ddd9 0%,#95c5cc 24%,#71a8ba 56%,#4f769f 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-dk{background:linear-gradient(92deg,#9fcac9 0%,#84b8bf 28%,#669cb0 60%,#456e97 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-dk{background:linear-gradient(92deg,#def6ef 0%,#a9d7dc 48%,#5e8fb8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-dk{background:linear-gradient(92deg,#afd7d4 0%,#97c7cb 30%,#73acbd 62%,#4e7aa2 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-dk{background:linear-gradient(92deg,#b7dfda 0%,#b7dfda 7%,#95c8cd 34%,#6fa9bc 66%,#48739a 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}'
)

$accLtVariants = @(
  '.acc-lt{background:linear-gradient(90deg,#1d1d1f 0%,#0e6b6b 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-lt{background:linear-gradient(92deg,#a8d1d8 0%,#85b7c6 26%,#639cb0 58%,#456d95 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-lt{background:linear-gradient(92deg,#94bfc6 0%,#79a9b8 28%,#5f8fa4 60%,#3f648b 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-lt{background:linear-gradient(92deg,#9acbd2 0%,#75aec0 50%,#527ea6 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-lt{background:linear-gradient(92deg,#9bc6cd 0%,#80afbd 30%,#618fa5 62%,#3f668e 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',
  '.acc-lt{background:linear-gradient(92deg,#a5ced3 0%,#a5ced3 7%,#88b5c2 34%,#668fa6 66%,#3f648a 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}'
)

foreach ($variant in $accDkVariants) {
  $sourceText = $sourceText.Replace($variant, $accDkFinal)
}

foreach ($variant in $accLtVariants) {
  $sourceText = $sourceText.Replace($variant, $accLtFinal)
}

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
Write-Output ("Mojibake scores: UTF8={0}, Default={1}, UTF8Repaired={2}, DefaultRepaired={3}" -f $candidates[0].Score, $candidates[1].Score, $candidates[2].Score, $candidates[3].Score)
Write-Output "Candidato elegido: $($bestCandidate.Name)"