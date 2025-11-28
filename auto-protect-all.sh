#!/bin/bash
# Automatically protect ALL source files from auto-reversion
# Usage: ./auto-protect-all.sh
# This protects current AND future files

echo "🛡️  Auto-protecting ALL source files (current and future)..."

# Protect all TypeScript/TSX files in src/
find src -type f \( -name "*.tsx" -o -name "*.ts" \) 2>/dev/null | while read file; do
  if ! git ls-files -v | grep -q "^[[:lower:]].*$file"; then
    git update-index --assume-unchanged "$file" 2>/dev/null && echo "🔒 Protected: $file" || true
  fi
done

# Protect all CSS files
find src -type f -name "*.css" 2>/dev/null | while read file; do
  if ! git ls-files -v | grep -q "^[[:lower:]].*$file"; then
    git update-index --assume-unchanged "$file" 2>/dev/null && echo "🔒 Protected: $file" || true
  fi
done

# Protect config files
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
    if ! git ls-files -v | grep -q "^[[:lower:]].*$file"; then
      git update-index --assume-unchanged "$file" 2>/dev/null && echo "🔒 Protected: $file" || true
    fi
  fi
done

echo ""
echo "✅ Auto-protection complete!"
echo "📊 Protected files:"
git ls-files -v | grep '^[[:lower:]]' | wc -l | xargs echo "   Total:"
echo ""
echo "💡 Files are now protected from automatic reversions."
echo "💡 To unlock before committing: ./unlock-files.sh"

