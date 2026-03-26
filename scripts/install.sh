#!/usr/bin/env bash
#
# DeckWing Installer — Mac/Linux
# Usage: curl -fsSL https://raw.githubusercontent.com/tfournet/deckwing/main/scripts/install.sh | bash
#
set -euo pipefail

GITHUB_REPO="tfournet/deckwing"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

info()  { echo -e "  ${GREEN}✓${NC} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail()  { echo -e "  ${RED}✗ $1${NC}"; exit 1; }
step()  { echo -e "\n  ${BOLD}$1${NC}"; }
detail(){ echo -e "    ${DIM}$1${NC}"; }

clear
echo ""
echo -e "  ${BOLD}🐔 DeckWing${NC}"
echo -e "  ${DIM}AI-powered presentations for Rewst${NC}"
echo ""
echo -e "  ${DIM}This will install DeckWing and its dependencies.${NC}"
echo -e "  ${DIM}It takes about 1-2 minutes.${NC}"
echo ""
echo -e "  ${DIM}────────────────────────────────────────────${NC}"

# ── Step 1: Node.js ───────────────────────────────────────────────────

step "Step 1/4 — Node.js"

if command -v node &>/dev/null; then
  NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
  if [ "$NODE_MAJOR" -lt 18 ]; then
    fail "Node.js 18+ required (found $(node -v)). Please upgrade and re-run."
  fi
  info "Node.js $(node -v) — already installed"
else
  detail "Node.js is required to run DeckWing. Installing..."
  echo ""
  if [[ "$(uname)" == "Darwin" ]] && command -v brew &>/dev/null; then
    brew install node
  elif command -v apt-get &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y nodejs
  else
    echo ""
    fail "Couldn't install Node.js automatically.\n\n    Download it from ${BOLD}https://nodejs.org${NC}${RED} and re-run this script."
  fi
  info "Node.js $(node -v) — installed"
fi

# ── Step 2: Git ───────────────────────────────────────────────────────

step "Step 2/4 — Git"

if command -v git &>/dev/null; then
  info "Git — already installed"
else
  detail "Git is needed to download DeckWing. Installing..."
  echo ""
  if [[ "$(uname)" == "Darwin" ]] && command -v brew &>/dev/null; then
    brew install git
  elif command -v apt-get &>/dev/null; then
    sudo apt-get install -y git
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y git
  else
    fail "Couldn't install Git automatically.\n\n    Download it from ${BOLD}https://git-scm.com${NC}${RED} and re-run this script."
  fi
  info "Git — installed"
fi

# ── Step 3: DeckWing ──────────────────────────────────────────────────

step "Step 3/4 — DeckWing"
detail "Downloading and installing the app..."
echo ""

if npm install -g "github:${GITHUB_REPO}" 2>&1 | tail -3; then
  if command -v deckwing &>/dev/null; then
    info "DeckWing — installed"
    detail "You can start it anytime by typing: deckwing"
  else
    warn "DeckWing installed but command not in PATH yet"
    detail "You may need to restart your terminal."
  fi
else
  fail "DeckWing installation failed. Check the error above and try again."
fi

# ── Step 3: Claude Code (for AI features) ─────────────────────────────

step "Step 4/4 — AI Setup (Claude)"
detail "Claude Code powers the AI presentation builder."
echo ""

if command -v claude &>/dev/null; then
  info "Claude Code — already installed"
else
  detail "Installing Claude Code..."
  npm install -g @anthropic-ai/claude-code 2>&1 | tail -1
  if command -v claude &>/dev/null; then
    info "Claude Code — installed"
  else
    warn "Claude Code installation needs a terminal restart"
    detail "Close and reopen your terminal, then run: deckwing"
  fi
fi

if command -v claude &>/dev/null; then
  CLAUDE_AUTH=$(claude auth status 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('loggedIn','false'))" 2>/dev/null || echo "false")
  if [ "$CLAUDE_AUTH" = "True" ] || [ "$CLAUDE_AUTH" = "true" ]; then
    info "Claude — signed in and ready"
  else
    info "Claude — installed, sign-in needed"
    detail "DeckWing will walk you through signing in when you open it."
  fi
fi

# ── Done ──────────────────────────────────────────────────────────────

echo ""
echo -e "  ${DIM}────────────────────────────────────────────${NC}"
echo ""
echo -e "  ${GREEN}${BOLD}All set! 🎉${NC}"
echo ""
echo -e "  ${BOLD}To start DeckWing, just type:${NC}"
echo ""
echo -e "    ${GREEN}deckwing${NC}"
echo ""
echo -e "  ${DIM}Your browser will open automatically.${NC}"
echo -e "  ${DIM}If this is your first time, you'll be asked to sign${NC}"
echo -e "  ${DIM}in with your Claude account — just click the button.${NC}"
echo ""

read -rp "  Launch DeckWing now? [Y/n] " LAUNCH_NOW
LAUNCH_NOW=${LAUNCH_NOW:-Y}
if [[ "$LAUNCH_NOW" =~ ^[Yy] ]]; then
  echo ""
  exec deckwing
fi
