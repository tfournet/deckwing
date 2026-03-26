#
# DeckWing Installer — Windows (PowerShell)
# Usage: irm <repo-url>/scripts/install.ps1 | iex
#

$ErrorActionPreference = "Stop"
$GithubRepo = "tfournet/deckwing"

function Write-Info($msg)  { Write-Host "  [OK] " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Warn($msg)  { Write-Host "  [!!] " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Fail($msg)  { Write-Host "  [XX] " -ForegroundColor Red -NoNewline; Write-Host $msg; exit 1 }
function Write-Step($msg)  { Write-Host "`n$msg" -ForegroundColor White }

Write-Host ""
Write-Host "  DeckWing Installer" -ForegroundColor Cyan
Write-Host "  AI-powered presentations for Rewst"
Write-Host ""

# ── Node.js ───────────────────────────────────────────────────────────

Write-Step "Checking Node.js..."

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

# ── DeckWing ──────────────────────────────────────────────────────────

Write-Step "Installing DeckWing..."
npm install -g "github:$GithubRepo"
Write-Info "DeckWing installed"

# ── Claude Code (for AI chat) ────────────────────────────────────────

Write-Step "Setting up AI chat..."

$hasClaude = $false
try {
    if (Get-Command claude -ErrorAction SilentlyContinue) { $hasClaude = $true }
} catch {}

if (-not $hasClaude) {
    Write-Info "Installing Claude Code..."
    npm install -g @anthropic-ai/claude-code 2>&1 | Out-Null
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    try { if (Get-Command claude -ErrorAction SilentlyContinue) { $hasClaude = $true } } catch {}
}

if ($hasClaude) {
    Write-Info "Claude Code found"
    try {
        $authJson = (claude auth status 2>$null) | ConvertFrom-Json
        if ($authJson.loggedIn -eq $true) {
            Write-Info "Claude Code authenticated"
        } else {
            Write-Warn "Claude Code needs login - the app will walk you through it"
        }
    } catch {
        Write-Warn "Could not check Claude Code auth"
    }
}

# ── Done ──────────────────────────────────────────────────────────────

Write-Step "Done!"
Write-Host ""
Write-Host "  To start DeckWing:" -ForegroundColor White
Write-Host "    deckwing"
Write-Host ""

$launchNow = Read-Host "  Launch now? [Y/n]"
if ($launchNow -eq "" -or $launchNow -match "^[Yy]") {
    deckwing
}
