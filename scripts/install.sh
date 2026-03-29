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

# Spinner — runs a command with an animated progress indicator
# Usage: run_with_spinner "Installing packages" npm install -g something
run_with_spinner() {
  local label="$1"
  shift
  local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  local pid elapsed=0

  "$@" >/dev/null 2>&1 &
  pid=$!

  while kill -0 "$pid" 2>/dev/null; do
    local frame="${frames[$((elapsed % ${#frames[@]}))]}"
    printf "\r    ${DIM}%s %s (%ds)${NC}  " "$frame" "$label" "$elapsed"
    sleep 1
    elapsed=$((elapsed + 1))
  done

  wait "$pid"
  local exit_code=$?
  printf "\r    \033[K"  # Clear the spinner line
  return $exit_code
}

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

step "Step 1/3 — Node.js"

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

# ── Step 2: DeckWing ──────────────────────────────────────────────────

step "Step 2/3 — DeckWing"

# Stop any running DeckWing instance first
if pgrep -f "deckwing" >/dev/null 2>&1; then
  detail "Stopping running DeckWing..."
  pkill -f "deckwing" 2>/dev/null || true
  sleep 1
fi

# Download the tarball from the latest release — no Git needed
TARBALL_URL="https://github.com/${GITHUB_REPO}/releases/latest/download/deckwing-0.1.0.tgz"

# Try to get the actual latest tarball name via GitHub API
LATEST_TAG=$(curl -fsSL "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" 2>/dev/null | grep '"tag_name"' | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/' || echo "")
if [ -n "$LATEST_TAG" ]; then
  VERSION="${LATEST_TAG#v}"
  TARBALL_URL="https://github.com/${GITHUB_REPO}/releases/latest/download/deckwing-${VERSION}.tgz"
fi

if run_with_spinner "Downloading and installing DeckWing" npm install -g "$TARBALL_URL"; then
  # Refresh PATH — npm global bin may not be in current session
  NPM_BIN=$(npm config get prefix 2>/dev/null)/bin
  if [ -d "$NPM_BIN" ] && [[ ":$PATH:" != *":$NPM_BIN:"* ]]; then
    export PATH="$NPM_BIN:$PATH"
  fi

  if command -v deckwing &>/dev/null; then
    DW_VERSION=$(node -e "console.log(require('$(npm config get prefix 2>/dev/null)/lib/node_modules/deckwing/package.json').version)" 2>/dev/null || echo "?")
    info "DeckWing v${DW_VERSION} — installed"
    detail "You can start it anytime by typing: deckwing"
  else
    warn "DeckWing installed but not in PATH for this session"
    echo ""
    if [ -n "$NPM_BIN" ]; then
      detail "Run it directly:"
      echo -e "    ${GREEN}${NPM_BIN}/deckwing${NC}"
      detail "Or restart your terminal and type: deckwing"
    else
      detail "Restart your terminal and type: deckwing"
    fi
  fi
else
  fail "DeckWing installation failed. Check the error above and try again."
fi

# ── Step 3: Claude Code (for AI features) ─────────────────────────────

step "Step 3/3 — AI Setup (Claude)"

CLAUDE_DIR="$HOME/.deckwing/claude"
CLAUDE_BIN="$CLAUDE_DIR/claude"

if [ -x "$CLAUDE_BIN" ]; then
  info "Claude Code — already installed"
else
  detail "Downloading Claude Code..."
  GCS_BUCKET="https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases"

  # Detect platform
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)
  case "$OS" in
    linux) PLAT="linux-x64" ;;
    darwin)
      if [ "$ARCH" = "arm64" ]; then PLAT="darwin-arm64"; else PLAT="darwin-x64"; fi ;;
    *) PLAT="linux-x64" ;;
  esac

  LATEST_VERSION=$(curl -fsSL "$GCS_BUCKET/latest" 2>/dev/null || echo "")
  if [ -n "$LATEST_VERSION" ]; then
    mkdir -p "$CLAUDE_DIR"
    DOWNLOAD_URL="$GCS_BUCKET/$LATEST_VERSION/$PLAT/claude"

    # Fetch expected checksum from manifest
    MANIFEST_URL="$GCS_BUCKET/$LATEST_VERSION/manifest.json"
    EXPECTED_CHECKSUM=$(curl -fsSL "$MANIFEST_URL" 2>/dev/null \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('platforms',{}).get('$PLAT',{}).get('checksum',''))" 2>/dev/null \
      || echo "")

    if run_with_spinner "Downloading Claude Code v${LATEST_VERSION}" curl -fsSL "$DOWNLOAD_URL" -o "$CLAUDE_BIN"; then
      if [ -n "$EXPECTED_CHECKSUM" ]; then
        # Compute actual checksum (sha256sum on Linux, shasum on macOS)
        if command -v sha256sum &>/dev/null; then
          ACTUAL_CHECKSUM=$(sha256sum "$CLAUDE_BIN" | cut -d' ' -f1)
        elif command -v shasum &>/dev/null; then
          ACTUAL_CHECKSUM=$(shasum -a 256 "$CLAUDE_BIN" | cut -d' ' -f1)
        else
          warn "Cannot verify checksum (sha256sum/shasum not found)"
          rm -f "$CLAUDE_BIN"
          ACTUAL_CHECKSUM=""
        fi

        if [ -n "$ACTUAL_CHECKSUM" ]; then
          if [ "$ACTUAL_CHECKSUM" != "$EXPECTED_CHECKSUM" ]; then
            rm -f "$CLAUDE_BIN"
            warn "Claude Code download failed checksum verification"
          else
            chmod +x "$CLAUDE_BIN"
            "$CLAUDE_BIN" install 2>/dev/null || true
            info "Claude Code v${LATEST_VERSION} — installed to $CLAUDE_DIR"
          fi
        fi
      else
        warn "Could not verify Claude Code checksum — skipping install"
        rm -f "$CLAUDE_BIN"
      fi
    else
      warn "Claude Code download failed — the app will prompt you to install it"
    fi
  else
    warn "Could not reach Claude Code download server"
  fi
fi

if [ -x "$CLAUDE_BIN" ]; then
  CLAUDE_AUTH=$("$CLAUDE_BIN" auth status 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('loggedIn','false'))" 2>/dev/null || echo "false")
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
  if command -v deckwing &>/dev/null; then
    exec deckwing
  elif [ -x "$(npm config get prefix 2>/dev/null)/bin/deckwing" ]; then
    exec "$(npm config get prefix)/bin/deckwing"
  else
    warn "Restart your terminal first, then type: deckwing"
  fi
fi
