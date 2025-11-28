#!/bin/bash
# Unlock ALL protected files before committing
# Usage: ./auto-unlock-all.sh

echo "🔓 Unlocking ALL protected files..."

# Unlock all TypeScript/TSX files in src/
find src -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | while read file; do
  if git ls-files -v | grep -q "^[[:lower:]].*$file"; then
    git update-index --no-assume-unchanged "$file" 2>/dev/null && echo "🔓 Unlocked: $file" || true
  fi
done

# Unlock all CSS files
find src -type f -name "*.css" 2>/dev/null | while read file; do
  if git ls-files -v | grep -q "^[[:lower:]].*$file"; then
    git update-index --no-assume-unchanged "$file" 2>/dev/null && echo "🔓 Unlocked: $file" || true
  fi
done

# Unlock config files
CONFIG_FILES=(
  "vite.config.ts"
  "tailwind.config.ts"
  "tsconfig.json"
  "tsconfig.app.json"
  "tsconfig.node.json"
  "postcss.config.js"
  "eslint.config.js"
)

for file in "${CONFIG_FILES[@]}"; do
  if [ -f "$file" ]; then
    if git ls-files -v | grep -q "^[[:lower:]].*$file"; then
      git update-index --no-assume-unchanged "$file" 2>/dev/null && echo "🔓 Unlocked: $file" || true
    fi
  fi
done

echo ""
echo "✅ All files unlocked!"
echo "💡 You can now commit your changes."

