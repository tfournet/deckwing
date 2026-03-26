#!/usr/bin/env bash
#
# DeckWing Installer — Mac/Linux
# Usage: curl -fsSL <repo-url>/scripts/install.sh | bash
#
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }
fail()  { echo -e "${RED}✗${NC} $1"; exit 1; }
step()  { echo -e "\n${BOLD}$1${NC}"; }

echo ""
echo -e "${BOLD}🐔 DeckWing Installer${NC}"
echo "   AI-powered presentations for Rewst"
echo ""

# ── Node.js ───────────────────────────────────────────────────────────

step "Checking Node.js..."

if command -v node &>/dev/null; then
  NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
  if [ "$NODE_MAJOR" -lt 18 ]; then
    fail "Node.js 18+ required (found $(node -v)). Please upgrade."
  fi
  info "Node.js $(node -v)"
else
  step "Installing Node.js..."
  if [[ "$(uname)" == "Darwin" ]] && command -v brew &>/dev/null; then
    brew install node
  elif command -v apt-get &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y nodejs
  else
    fail "Install Node.js 18+ from https://nodejs.org and re-run."
  fi
  info "Node.js $(node -v) installed"
fi

# ── DeckWing ──────────────────────────────────────────────────────────

# TODO: Update org name when repo is published
step "Installing DeckWing..."
npm install -g github:rewst-io/deckwing
info "DeckWing installed"

# ── Claude Code (for AI chat) ────────────────────────────────────────

step "Setting up AI chat..."

if command -v claude &>/dev/null; then
  info "Claude Code found"
else
  info "Installing Claude Code..."
  npm install -g @anthropic-ai/claude-code 2>&1 | tail -1
fi

if command -v claude &>/dev/null; then
  CLAUDE_AUTH=$(claude auth status 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('loggedIn','false'))" 2>/dev/null || echo "false")
  if [ "$CLAUDE_AUTH" = "True" ] || [ "$CLAUDE_AUTH" = "true" ]; then
    info "Claude Code authenticated"
  else
    warn "Claude Code needs login — the app will walk you through it"
  fi
fi

# ── Done ──────────────────────────────────────────────────────────────

step "Done!"
echo ""
echo -e "  ${BOLD}To start DeckWing:${NC}"
echo "    deckwing"
echo ""

read -rp "  Launch now? [Y/n] " LAUNCH_NOW
LAUNCH_NOW=${LAUNCH_NOW:-Y}
if [[ "$LAUNCH_NOW" =~ ^[Yy] ]]; then
  exec deckwing
fi
