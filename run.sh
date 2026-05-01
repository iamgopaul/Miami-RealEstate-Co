#!/usr/bin/env bash
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

echo ""
echo "  Miami Leads — setup & run"
echo "────────────────────────────"

# ── 1. Install Bun if missing ────────────────────────────────────────────
if ! command -v bun &>/dev/null; then
  warn "Bun not found — installing..."
  curl -fsSL https://bun.sh/install | bash
  # Add bun to PATH for the rest of this script
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  info "Bun installed: $(bun --version)"
else
  info "Bun $(bun --version)"
fi

# ── 2. Install dependencies ──────────────────────────────────────────────
info "Installing dependencies..."
bun install --frozen-lockfile

# ── 3. Bootstrap .env ───────────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  warn ".env created from .env.example"
  warn "Open .env and fill in GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY"
  warn "Then re-run this script."
  echo ""
  exit 0
fi

# ── 4. Check required env vars ───────────────────────────────────────────
source .env
MISSING=()
[ -z "${GOOGLE_SHEET_ID:-}"      ] && MISSING+=("GOOGLE_SHEET_ID")
[ -z "${GOOGLE_CLIENT_EMAIL:-}"  ] && MISSING+=("GOOGLE_CLIENT_EMAIL")
[ -z "${GOOGLE_PRIVATE_KEY:-}"   ] && MISSING+=("GOOGLE_PRIVATE_KEY")

if [ ${#MISSING[@]} -gt 0 ]; then
  warn "Missing values in .env:"
  for v in "${MISSING[@]}"; do echo "    • $v"; done
  warn "Google Sheets integration will log leads to console until these are set."
  echo ""
fi

# ── 5. Free the port if something is already using it ────────────────────
PORT="${PORT:-3000}"
EXISTING_PID=$(lsof -ti tcp:"${PORT}" 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
  warn "Port ${PORT} in use (PID ${EXISTING_PID}) — stopping it..."
  kill "$EXISTING_PID" 2>/dev/null || true
  sleep 0.5
fi

# ── 6. Start ─────────────────────────────────────────────────────────────
info "Starting server on http://localhost:${PORT}"
echo ""
exec bun src/server.ts
