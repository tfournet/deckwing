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

# ── Step 2: Git ───────────────────────────────────────────────────────

Write-Step "Step 2/4 - Git"

$hasGit = $false
try {
    $gitVersion = (git --version 2>$null)
    if ($gitVersion) {
        Write-Info "Git - already installed"
        $hasGit = $true
    }
} catch {}

if (-not $hasGit) {
    Write-Detail "Git is needed to download DeckWing. Installing..."
    try {
        winget install Git.Git --accept-source-agreements --accept-package-agreements 2>&1 | Out-Null
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        $gitCheck = (git --version 2>$null)
        if ($gitCheck) {
            Write-Info "Git - installed"
            $hasGit = $true
        } else {
            Write-Warn "Git installed but needs a terminal restart"
            Write-Detail "Close this window, reopen PowerShell, and run the installer again."
            Read-Host "  Press Enter to exit"
            exit 0
        }
    } catch {
        Write-Host ""
        Write-Fail "Could not install Git. Download from https://git-scm.com and re-run."
    }
}

# ── Step 3: DeckWing ──────────────────────────────────────────────────

Write-Step "Step 3/4 - DeckWing"
Write-Detail "Downloading and installing the app..."

try {
    npm install -g "github:$GithubRepo" 2>&1 | Out-Null
    # Verify it actually installed
    $deckwingPath = (Get-Command deckwing -ErrorAction SilentlyContinue)
    if ($deckwingPath) {
        Write-Info "DeckWing - installed"
        Write-Detail "You can start it anytime by typing: deckwing"
    } else {
        Write-Warn "DeckWing installed but command not found yet"
        Write-Detail "You may need to restart your terminal."
    }
} catch {
    Write-Host ""
    Write-Fail "DeckWing installation failed. Check the error above and try again."
}

# ── Step 4: Claude Code (for AI features) ─────────────────────────────

Write-Step "Step 4/4 - AI Setup (Claude)"
Write-Detail "Claude Code powers the AI presentation builder."

$hasClaude = $false
try {
    if (Get-Command claude -ErrorAction SilentlyContinue) { $hasClaude = $true }
} catch {}

if (-not $hasClaude) {
    Write-Detail "Installing Claude Code..."
    try {
        npm install -g @anthropic-ai/claude-code 2>&1 | Out-Null
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        try { if (Get-Command claude -ErrorAction SilentlyContinue) { $hasClaude = $true } } catch {}
    } catch {
        Write-Warn "Claude Code installation failed - you can install it later"
    }
}

if ($hasClaude) {
    try {
        $authJson = (claude auth status 2>$null) | ConvertFrom-Json
        if ($authJson.loggedIn -eq $true) {
            Write-Info "Claude - signed in and ready"
        } else {
            Write-Info "Claude - installed, sign-in needed"
            Write-Detail "DeckWing will walk you through signing in when you open it."
        }
    } catch {
        Write-Info "Claude Code - installed"
        Write-Detail "DeckWing will walk you through signing in when you open it."
    }
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
    deckwing
}
