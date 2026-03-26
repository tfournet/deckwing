#!/usr/bin/env bash
#
# DeckWing Installer — Mac/Linux
# Usage: curl -fsSL <your-raw-url>/scripts/install.sh | bash
#
set -euo pipefail

# TODO: Update when repo is published
REPO="https://github.com/rewst-io/deckwing.git"
INSTALL_DIR="$HOME/deckwing"
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

# ── Check / install dependencies ──────────────────────────────────────

step "Checking dependencies..."

# Node.js
if command -v node &>/dev/null; then
  NODE_VERSION=$(node -v)
  NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
  if [ "$NODE_MAJOR" -lt 18 ]; then
    fail "Node.js 18+ required (found ${NODE_VERSION}). Please upgrade."
  fi
  info "Node.js ${NODE_VERSION}"
else
  step "Installing Node.js..."
  if [[ "$(uname)" == "Darwin" ]]; then
    if command -v brew &>/dev/null; then
      brew install node
      info "Node.js installed via Homebrew"
    else
      fail "Node.js not found. Install Homebrew (https://brew.sh) then re-run, or install Node.js from https://nodejs.org"
    fi
  else
    if command -v apt-get &>/dev/null; then
      curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
      sudo apt-get install -y nodejs
      info "Node.js installed"
    elif command -v dnf &>/dev/null; then
      sudo dnf install -y nodejs
      info "Node.js installed"
    else
      fail "Node.js not found. Install from https://nodejs.org and re-run."
    fi
  fi
fi

# Git
if command -v git &>/dev/null; then
  info "Git $(git --version | awk '{print $3}')"
else
  fail "Git not found. Install git and re-run this script."
fi

# Claude Code — install automatically if missing
if command -v claude &>/dev/null; then
  info "Claude Code found"
else
  step "Installing Claude Code..."
  npm install -g @anthropic-ai/claude-code 2>&1 | tail -1
  if command -v claude &>/dev/null; then
    info "Claude Code installed"
  else
    warn "Claude Code install failed — AI chat will require an API key instead"
  fi
fi

# Check Claude auth — don't block, app will handle it
if command -v claude &>/dev/null; then
  CLAUDE_AUTH=$(claude auth status 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('loggedIn','false'))" 2>/dev/null || echo "false")
  if [ "$CLAUDE_AUTH" = "True" ] || [ "$CLAUDE_AUTH" = "true" ]; then
    info "Claude Code authenticated"
  else
    warn "Claude Code not logged in — the app will prompt you to authenticate"
  fi
fi

# ── Install DeckWing ──────────────────────────────────────────────────

step "Installing DeckWing..."

if [ -d "$INSTALL_DIR" ]; then
  info "Updating existing installation..."
  cd "$INSTALL_DIR"
  git pull --quiet
else
  info "Cloning DeckWing..."
  git clone --quiet "$REPO" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

info "Installing packages..."
npm install --silent 2>&1 | tail -1

# ── Create launcher script ────────────────────────────────────────────

step "Creating launcher..."

LAUNCHER="$HOME/.local/bin/deckwing"
mkdir -p "$(dirname "$LAUNCHER")"

cat > "$LAUNCHER" << 'LAUNCH'
#!/usr/bin/env bash
cd "$HOME/deckwing" || exit 1

# Start both servers
npm run dev:full &
SERVER_PID=$!

# Wait for frontend to be ready
echo "Starting DeckWing..."
for i in $(seq 1 15); do
  if curl -s -o /dev/null http://localhost:3000 2>/dev/null; then
    break
  fi
  sleep 1
done

# Open browser
if command -v open &>/dev/null; then
  open http://localhost:3000
elif command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:3000
fi

echo ""
echo "DeckWing is running at http://localhost:3000"
echo "Press Ctrl+C to stop."
echo ""

wait $SERVER_PID
LAUNCH

chmod +x "$LAUNCHER"

# Check if ~/.local/bin is in PATH
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  # Try to add it automatically
  SHELL_RC=""
  if [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
  elif [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
  fi

  if [ -n "$SHELL_RC" ]; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
    info "Added ~/.local/bin to PATH in $(basename "$SHELL_RC")"
    export PATH="$HOME/.local/bin:$PATH"
  else
    warn "Add ~/.local/bin to your PATH manually"
  fi
fi

# ── Done ──────────────────────────────────────────────────────────────

step "Installation complete!"
echo ""
echo -e "  ${BOLD}Start DeckWing:${NC}"
echo "    deckwing"
echo ""

# Offer to launch now
read -rp "  Launch DeckWing now? [Y/n] " LAUNCH_NOW
LAUNCH_NOW=${LAUNCH_NOW:-Y}
if [[ "$LAUNCH_NOW" =~ ^[Yy] ]]; then
  exec "$LAUNCHER"
fi
