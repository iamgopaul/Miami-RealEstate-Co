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
  warn "Open .env and fill in your credentials, then re-run this script."
  warn "Then re-run this script."
  echo ""
  exit 0
fi

# ── 4. Read PORT ─────────────────────────────────────────────────────────
# Parse with grep — never source .env so shell metacharacters can't break this
_env() { grep -E "^${1}=" .env 2>/dev/null | head -1 | cut -d'=' -f2- | tr -d '"' | tr -d "'"; }
PORT="$(_env PORT)"

# ── 5. Free the port if something is already using it ────────────────────
PORT="${PORT:-3000}"
EXISTING_PIDS=$(lsof -ti tcp:"${PORT}" 2>/dev/null || true)
if [ -n "$EXISTING_PIDS" ]; then
  warn "Port ${PORT} in use — stopping process(es)..."
  echo "$EXISTING_PIDS" | xargs kill 2>/dev/null || true
  sleep 0.8
fi

# ── 6. Start ─────────────────────────────────────────────────────────────
info "Starting server on http://localhost:${PORT}"
echo ""
exec bun src/server.ts
