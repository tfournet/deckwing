#
# DeckWing Installer — Windows (PowerShell)
# Usage: irm https://raw.githubusercontent.com/tfournet/deckwing/main/scripts/install.ps1 | iex
#

$ErrorActionPreference = "Stop"
$GithubRepo = "tfournet/deckwing"

function Write-Info($msg)  { Write-Host "    " -NoNewline; Write-Host "[OK]" -ForegroundColor Green -NoNewline; Write-Host " $msg" }
function Write-Warn($msg)  { Write-Host "    " -NoNewline; Write-Host "[!!]" -ForegroundColor Yellow -NoNewline; Write-Host " $msg" }
function Write-Fail($msg)  { Write-Host "    " -NoNewline; Write-Host "[XX] $msg" -ForegroundColor Red; exit 1 }
function Write-Step($msg)  { Write-Host ""; Write-Host "  $msg" -ForegroundColor White }
function Write-Detail($msg){ Write-Host "    $msg" -ForegroundColor DarkGray }

# Run a command with a spinner and elapsed time
function Invoke-WithSpinner {
    param([string]$Label, [scriptblock]$Command)
    $frames = @('|','/','-','\')
    $job = Start-Job -ScriptBlock $Command
    $elapsed = 0
    while ($job.State -eq 'Running') {
        $frame = $frames[$elapsed % $frames.Count]
        Write-Host "`r    $frame $Label ($($elapsed)s)  " -NoNewline -ForegroundColor DarkGray
        Start-Sleep -Seconds 1
        $elapsed++
    }
    Write-Host "`r                                                       `r" -NoNewline
    $result = Receive-Job -Job $job
    $exitOk = $job.State -eq 'Completed'
    Remove-Job -Job $job
    return $exitOk
}

Clear-Host
Write-Host ""
Write-Host "  DeckWing" -ForegroundColor Cyan -NoNewline
Write-Host " Installer" -ForegroundColor White
Write-Host "  AI-powered presentations for Rewst" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  This will install DeckWing and its dependencies." -ForegroundColor DarkGray
Write-Host "  It takes about 1-2 minutes." -ForegroundColor DarkGray
Write-Host ""
Write-Host "  ────────────────────────────────────────────" -ForegroundColor DarkGray

# ── Step 1: Node.js ───────────────────────────────────────────────────

Write-Step "Step 1/4 - Node.js"

$hasNode = $false
try {
    $nodeVersion = (node -v 2>$null)
    if ($nodeVersion) {
        $major = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($major -lt 18) {
            Write-Fail "Node.js 18+ required (found $nodeVersion). Run: winget upgrade OpenJS.NodeJS.LTS"
        }
        Write-Info "Node.js $nodeVersion - already installed"
        $hasNode = $true
    }
} catch {}

if (-not $hasNode) {
    Write-Detail "Node.js is required to run DeckWing. Installing..."
    try {
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements 2>&1 | Out-Null
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        $nodeVersion = (node -v 2>$null)
        if ($nodeVersion) {
            Write-Info "Node.js $nodeVersion - installed"
        } else {
            Write-Host ""
            Write-Fail "Node.js install failed. Download from https://nodejs.org and re-run."
        }
    } catch {
        Write-Host ""
        Write-Fail "Could not install Node.js. Download from https://nodejs.org and re-run."
    }
}

# ── Step 2: DeckWing ──────────────────────────────────────────────────

Write-Step "Step 2/4 - DeckWing"

# Stop any running DeckWing instance first
$running = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    try { $_.CommandLine -match "deckwing" } catch { $false }
}
if ($running) {
    Write-Detail "Stopping running DeckWing..."
    $running | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

try {
    # Download tarball from latest release — no Git needed
    $latestUrl = "https://api.github.com/repos/$GithubRepo/releases/latest"
    $version = "0.1.0"
    try {
        $releaseInfo = Invoke-RestMethod -Uri $latestUrl -ErrorAction SilentlyContinue
        $version = $releaseInfo.tag_name -replace '^v', ''
    } catch {}
    $tarballUrl = "https://github.com/$GithubRepo/releases/latest/download/deckwing-$version.tgz"

    $installOk = Invoke-WithSpinner -Label "Downloading and installing DeckWing" -Command ([scriptblock]::Create("npm install -g $tarballUrl 2>&1 | Out-Null"))

    # Refresh PATH to pick up npm global bin
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    $npmPrefix = (npm config get prefix 2>$null)
    if ($npmPrefix -and (Test-Path $npmPrefix)) {
        $env:Path = "$env:Path;$npmPrefix"
    }

    $deckwingPath = (Get-Command deckwing -ErrorAction SilentlyContinue)
    if ($deckwingPath) {
        $dwVersion = "?"
        try {
            $pkgPath = Join-Path (Join-Path (Join-Path $npmPrefix "node_modules") "deckwing") "package.json"
            if (Test-Path $pkgPath) {
                $dwVersion = (node -e "console.log(JSON.parse(require('fs').readFileSync('$($pkgPath -replace '\\','/')','utf-8')).version)" 2>$null)
            }
        } catch {}
        if (-not $dwVersion) { $dwVersion = "?" }
        Write-Info "DeckWing v$dwVersion installed"
        Write-Detail "You can start it anytime by typing: deckwing"
    } else {
        $npmBin = (npm config get prefix 2>$null)
        Write-Warn "DeckWing installed but not in PATH"
        Write-Host ""
        if ($npmBin) {
            Write-Detail "Run it directly:"
            Write-Host ""
            Write-Host "    node `"$npmBin\node_modules\deckwing\bin\deckwing.js`"" -ForegroundColor Green
            Write-Detail "Or restart your terminal and type: deckwing"
        } else {
            Write-Detail "Close this terminal, reopen, and try: deckwing"
        }
    }
} catch {
    Write-Host ""
    Write-Fail "DeckWing installation failed. Check the error above and try again."
}

# ── Step 3: AI Setup ──────────────────────────────────────────────────

Write-Step "Step 3/4 - Git"

$hasGit = $false
try { if (Get-Command git -ErrorAction SilentlyContinue) { $hasGit = $true } } catch {}

if ($hasGit) {
    Write-Info "Git - already installed"
} else {
    Write-Detail "Git is required by Claude Code on Windows. Installing..."
    try {
        winget install Git.Git --accept-source-agreements --accept-package-agreements 2>&1 | Out-Null
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        Write-Info "Git installed"
    } catch {
        Write-Warn "Could not install Git automatically"
        Write-Detail "Download from https://git-scm.com and re-run the installer."
    }
}

Write-Step "Step 4/4 - Claude Code"

$claudeDir = Join-Path (Join-Path $env:USERPROFILE ".deckwing") "claude"
$claudeBin = Join-Path $claudeDir "claude.exe"
$hasClaude = Test-Path $claudeBin

if (-not $hasClaude) {
    try {
        $gcsBucket = "https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases"
        if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { $plat = "win32-arm64" } else { $plat = "win32-x64" }

        $latestVersion = Invoke-RestMethod -Uri "$gcsBucket/latest" -ErrorAction Stop
        Write-Detail "Downloading Claude Code v$latestVersion..."

        $manifest = Invoke-RestMethod -Uri "$gcsBucket/$latestVersion/manifest.json" -ErrorAction Stop
        $checksum = $manifest.platforms.$plat.checksum

        New-Item -ItemType Directory -Force -Path $claudeDir | Out-Null
        $downloadUrl = "$gcsBucket/$latestVersion/$plat/claude.exe"

        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $downloadUrl -OutFile $claudeBin -ErrorAction Stop

        $actualHash = (Get-FileHash -Path $claudeBin -Algorithm SHA256).Hash.ToLower()
        if ($checksum -and $actualHash -ne $checksum) {
            Remove-Item -Force $claudeBin
            Write-Warn "Download failed checksum verification"
        } else {
            $hasClaude = $true
            Write-Info "Claude Code v$latestVersion installed"
        }
    } catch {
        Write-Warn "Claude Code download failed - DeckWing will prompt you to install it"
    }
}

if ($hasClaude) {
    Write-Info "Claude Code ready"
    Write-Detail "DeckWing will walk you through signing in when you open it."
} else {
    Write-Warn "Claude Code not available right now"
    Write-Detail "You can install it later: npm install -g @anthropic-ai/claude-code"
}

# ── Done ──────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  All set! " -ForegroundColor Green -NoNewline
Write-Host "" -ForegroundColor White
Write-Host ""
Write-Host "  To start DeckWing, just type:" -ForegroundColor White
Write-Host ""
Write-Host "    deckwing" -ForegroundColor Green
Write-Host ""
Write-Host "  Your browser will open automatically." -ForegroundColor DarkGray
Write-Host "  If this is your first time, you'll be asked to sign" -ForegroundColor DarkGray
Write-Host "  in with your Claude account - just click the button." -ForegroundColor DarkGray
Write-Host ""

$launchNow = Read-Host "  Launch DeckWing now? [Y/n]"
if ($launchNow -eq "" -or $launchNow -match "^[Yy]") {
    Write-Host ""
    $dw = (Get-Command deckwing -ErrorAction SilentlyContinue)
    if ($dw) {
        & deckwing
    } else {
        # Fall back to direct node invocation
        $npmPrefix = (npm config get prefix 2>$null)
        $directPath = "$npmPrefix\node_modules\deckwing\bin\deckwing.js"
        if (Test-Path $directPath) {
            node $directPath
        } else {
            Write-Warn "Couldn't find deckwing. Restart your terminal and type: deckwing"
        }
    }
}
