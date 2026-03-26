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

Write-Step "Step 1/3 - Node.js"

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

Write-Step "Step 2/3 - DeckWing"

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
        $dwVersion = (node -e "console.log(require('$npmPrefix/node_modules/deckwing/package.json').version)" 2>$null) ?? "?"
        Write-Info "DeckWing v$dwVersion - installed"
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

# ── Step 4: Claude Code (for AI features) ─────────────────────────────

Write-Step "Step 3/3 - AI Setup (Claude)"
Write-Detail "Claude Code powers the AI presentation builder."

$hasClaude = $false
try {
    if (Get-Command claude -ErrorAction SilentlyContinue) { $hasClaude = $true }
} catch {}

if (-not $hasClaude) {
    try {
        Invoke-WithSpinner -Label "Installing Claude Code" -Command { irm https://claude.ai/install.ps1 | iex 2>&1 | Out-Null } | Out-Null
        # Save the npm prefix so DeckWing can find claude
        $npmPrefix = (npm config get prefix 2>$null)
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
