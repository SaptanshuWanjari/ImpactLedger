#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIAGRAM_DIR="$ROOT_DIR/diagrams"
ASSET_DIR="$ROOT_DIR/assets"

mkdir -p "$ASSET_DIR"

for f in "$DIAGRAM_DIR"/*.mmd; do
  name="$(basename "$f" .mmd)"
  mmdc -i "$f" -o "$ASSET_DIR/$name.png" -b transparent -w 2200
done

echo "Rendered diagrams to $ASSET_DIR"
