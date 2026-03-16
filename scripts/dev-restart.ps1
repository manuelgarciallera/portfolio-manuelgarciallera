param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$logOut = Join-Path $repo ".codex-dev.log"
$logErr = Join-Path $repo ".codex-dev.err"

Write-Host "[dev-restart] Repo: $repo"

# Stop stale Next.js dev processes for this repository only
$nodeProcesses = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object {
    $_.CommandLine -and
    $_.CommandLine -like "*$repo*" -and
    ( $_.CommandLine -like "*next*dev*" -or $_.CommandLine -like "*start-server.js*" )
  }

foreach ($proc in $nodeProcesses) {
  try {
    Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
    Write-Host "[dev-restart] Stopped process $($proc.ProcessId)"
  } catch {
    Write-Host "[dev-restart] Could not stop process $($proc.ProcessId): $($_.Exception.Message)"
  }
}

Start-Sleep -Milliseconds 400

$lockPath = Join-Path $repo ".next\dev\lock"
if (Test-Path $lockPath) {
  Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
  Write-Host "[dev-restart] Removed stale lock: $lockPath"
}

if (Test-Path $logOut) { Remove-Item $logOut -Force }
if (Test-Path $logErr) { Remove-Item $logErr -Force }

$proc = Start-Process -FilePath "npm.cmd" `
  -ArgumentList @("run","dev") `
  -WorkingDirectory $repo `
  -RedirectStandardOutput $logOut `
  -RedirectStandardError $logErr `
  -PassThru

Write-Host "[dev-restart] Started npm run dev (PID: $($proc.Id))"

$ok = $false
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Milliseconds 500
  try {
    $res = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 2
    if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 500) {
      $ok = $true
      break
    }
  } catch {
    # keep waiting
  }
}

if (-not $ok) {
  Write-Host "[dev-restart] Server did not respond on http://localhost:$Port"
  if (Test-Path $logOut) {
    Write-Host "---- .codex-dev.log (tail) ----"
    Get-Content $logOut -Tail 40
  }
  if (Test-Path $logErr) {
    Write-Host "---- .codex-dev.err (tail) ----"
    Get-Content $logErr -Tail 40
  }
  exit 1
}

Write-Host "[dev-restart] OK: http://localhost:$Port"
exit 0
