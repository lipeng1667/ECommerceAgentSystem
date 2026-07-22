#!/usr/bin/env bash
#
# File: check-hex.sh
# Purpose: Dark-mode audit (UX finding 5.2) — list hardcoded hex colors outside the
# theme token sources. Hardcoded hexes (especially light backgrounds) break dark mode;
# colors must come from the CSS custom properties in src/styles/tokens.css
# (var(--ark-*)) or, for derived shades, color-mix() over those tokens.
#
# Token sources excluded from the audit:
#   - src/styles/tokens.css   (the CSS token registry — the one place hexes belong)
#   - src/app/providers.tsx   (antd ConfigProvider theme tokens, mirrors tokens.css)
#
# Intentionally theme-invariant surfaces (e.g. the fixed dark agent terminal or the
# login showcase panel) may be wrapped between `/* hex-audit-off */` and
# `/* hex-audit-on */` marker comments; lines inside such a block are skipped.
# Use markers sparingly and only with a justification comment.
#
# Usage: scripts/check-hex.sh [path ...]     (default: src)
# Exit:  0 when clean, 1 when hits were found.
#
# Author: Michael Lee
# Created: 2026-07-22 (WS-E, E7)

set -euo pipefail
cd "$(dirname "$0")/.."

paths=("$@")
if [ ${#paths[@]} -eq 0 ]; then
  paths=(src)
fi

output=$(find "${paths[@]}" -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) \
    ! -path '*/styles/tokens.css' ! -path '*/app/providers.tsx' -print0 |
  xargs -0 perl -ne '
    $off = 1 if /hex-audit-off/;
    print "$ARGV:$.: $_" if !$off && /#[0-9a-fA-F]{3,8}\b/;
    $off = 0 if /hex-audit-on/;
    if (eof) { $off = 0; close ARGV; }
  ')

if [ -n "$output" ]; then
  echo "$output"
  count=$(printf '%s\n' "$output" | wc -l | tr -d ' ')
  echo ""
  echo "check-hex: $count hardcoded hex color line(s) found outside token sources."
  echo "Use var(--ark-*) tokens from src/styles/tokens.css (or color-mix over them)."
  exit 1
fi

echo "check-hex: clean — no hardcoded hex colors outside token sources."
