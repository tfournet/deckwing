#
# DeckWing Installer — Windows (PowerShell)
# Usage: irm <your-raw-url>/scripts/install.ps1 | iex
#

$ErrorActionPreference = "Stop"
# TODO: Update when repo is published
$Repo = "https://github.com/rewst-io/deckwing.git"
$InstallDir = "$env:USERPROFILE\deckwing"

function Write-Info($msg)  { Write-Host "  [OK] " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Warn($msg)  { Write-Host "  [!!] " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Fail($msg)  { Write-Host "  [XX] " -ForegroundColor Red -NoNewline; Write-Host $msg; exit 1 }
function Write-Step($msg)  { Write-Host "`n$msg" -ForegroundColor White }

Write-Host ""
Write-Host "  DeckWing Installer" -ForegroundColor Cyan
Write-Host "  AI-powered presentations for Rewst"
Write-Host ""

# ── Check / install dependencies ──────────────────────────────────────

Write-Step "Checking dependencies..."

# Node.js — install via winget if missing
$hasNode = $false
try {
    $nodeVersion = (node -v 2>$null)
    if ($nodeVersion) {
        $major = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($major -lt 18) {
            Write-Fail "Node.js 18+ required (found $nodeVersion). Run: winget upgrade OpenJS.NodeJS.LTS"
        }
        Write-Info "Node.js $nodeVersion"
        $hasNode = $true
    }
} catch {}

if (-not $hasNode) {
    Write-Step "Installing Node.js..."
    try {
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements 2>&1 | Out-Null
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        $nodeVersion = (node -v 2>$null)
        if ($nodeVersion) {
            Write-Info "Node.js $nodeVersion installed"
        } else {
            Write-Fail "Node.js install failed. Download from https://nodejs.org and re-run."
        }
    } catch {
        Write-Fail "Could not install Node.js. Download from https://nodejs.org and re-run."
    }
}

# Git — install via winget if missing
$hasGit = $false
try {
    $gitVersion = (git --version 2>$null)
    if ($gitVersion) {
        Write-Info $gitVersion
        $hasGit = $true
    }
} catch {}

if (-not $hasGit) {
    Write-Step "Installing Git..."
    try {
        winget install Git.Git --accept-source-agreements --accept-package-agreements 2>&1 | Out-Null
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        Write-Info "Git installed"
    } catch {
        Write-Fail "Could not install Git. Download from https://git-scm.com and re-run."
    }
}

# Claude Code — install automatically if missing
$hasClaude = $false
try {
    $claudePath = (Get-Command claude -ErrorAction SilentlyContinue)
    if ($claudePath) {
        Write-Info "Claude Code found"
        $hasClaude = $true
    }
} catch {}

if (-not $hasClaude) {
    Write-Step "Installing Claude Code..."
    try {
        npm install -g @anthropic-ai/claude-code 2>&1 | Out-Null
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        $claudeCheck = (Get-Command claude -ErrorAction SilentlyContinue)
        if ($claudeCheck) {
            Write-Info "Claude Code installed"
            $hasClaude = $true
        } else {
            Write-Warn "Claude Code install may need a terminal restart"
        }
    } catch {
        Write-Warn "Claude Code install failed - AI chat will require an API key instead"
    }
}

# Check Claude auth — don't block, app will handle it
if ($hasClaude) {
    try {
        $authJson = (claude auth status 2>$null) | ConvertFrom-Json
        if ($authJson.loggedIn -eq $true) {
            Write-Info "Claude Code authenticated"
        } else {
            Write-Warn "Claude Code not logged in - the app will prompt you to authenticate"
        }
    } catch {
        Write-Warn "Could not check Claude Code auth status"
    }
}

# ── Install DeckWing ──────────────────────────────────────────────────

Write-Step "Installing DeckWing..."

if (Test-Path $InstallDir) {
    Write-Info "Updating existing installation..."
    Push-Location $InstallDir
    git pull --quiet
} else {
    Write-Info "Cloning DeckWing..."
    git clone --quiet $Repo $InstallDir
    Push-Location $InstallDir
}

Write-Info "Installing packages (this may take a minute)..."
npm install --silent 2>&1 | Select-Object -Last 1

Pop-Location

# ── Create launcher ───────────────────────────────────────────────────

Write-Step "Creating launcher..."

$LauncherDir = "$env:USERPROFILE\.local\bin"
$LauncherPath = "$LauncherDir\deckwing.cmd"

if (-not (Test-Path $LauncherDir)) {
    New-Item -ItemType Directory -Path $LauncherDir -Force | Out-Null
}

@"
@echo off
cd /d "%USERPROFILE%\deckwing"
echo Starting DeckWing...
timeout /t 3 /nobreak >nul & start "" http://localhost:3000
npm run dev:full
"@ | Out-File -FilePath $LauncherPath -Encoding ASCII

# Add to PATH if not already there
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$LauncherDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$LauncherDir", "User")
    $env:Path = "$env:Path;$LauncherDir"
    Write-Info "Added launcher to PATH"
}

# ── Done ──────────────────────────────────────────────────────────────

Write-Step "Installation complete!"
Write-Host ""
Write-Host "  To start DeckWing:" -ForegroundColor White
Write-Host "    deckwing"
Write-Host ""

# Offer to launch now
$launchNow = Read-Host "  Launch DeckWing now? [Y/n]"
if ($launchNow -eq "" -or $launchNow -match "^[Yy]") {
    & $LauncherPath
}
