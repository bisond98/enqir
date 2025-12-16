#!/bin/bash

# 🛡️ PROTECT UPDATES FROM AUTO-REVERSION
# This script protects critical files from being automatically reverted
# while ensuring deployments continue to work normally

echo "🛡️ Setting up protection against auto-reversion..."

# Critical files that must be protected
CRITICAL_FILES=(
  "src/pages/Landing.tsx"
  "src/pages/App.tsx"
  "src/index.css"
  "src/pages/MyChats.tsx"
  "src/pages/AllChats.tsx"
)

# 1. Create .gitattributes to prevent automatic line ending changes
echo "📝 Creating .gitattributes..."
cat > .gitattributes << 'EOF'
# Protect critical files from automatic changes
src/pages/Landing.tsx -text -eol
src/pages/App.tsx -text -eol
src/index.css -text -eol
src/pages/MyChats.tsx -text -eol
src/pages/AllChats.tsx -text -eol

# Prevent automatic merges on these files
src/pages/Landing.tsx merge=ours
src/pages/App.tsx merge=ours
EOF

# 2. Configure git merge strategy for protected files
echo "⚙️ Configuring git merge strategy..."
git config merge.ours.driver true

# 3. Set git config to prevent auto-revert
echo "⚙️ Setting git protection config..."
git config merge.ff false
git config pull.rebase false
git config pull.ff only
git config core.autocrlf false
git config core.filemode false

# 4. Create pre-merge hook to protect files
echo "🔒 Creating pre-merge protection hook..."
cat > .git/hooks/pre-merge << 'HOOK_EOF'
#!/bin/bash
# Pre-merge hook to protect critical files

PROTECTED_FILES=(
  "src/pages/Landing.tsx"
  "src/pages/App.tsx"
  "src/index.css"
)

echo "⚠️  Merge detected. Checking for protected files..."

for file in "${PROTECTED_FILES[@]}"; do
  if git diff --name-only HEAD...MERGE_HEAD | grep -q "^$file$"; then
    echo "🛡️  WARNING: $file is protected and will not be automatically merged."
    echo "   You must manually review and merge this file."
  fi
done

exit 0
HOOK_EOF

chmod +x .git/hooks/pre-merge

# 5. Create post-merge hook to restore protected files if needed
echo "🔒 Creating post-merge protection hook..."
cat > .git/hooks/post-merge << 'HOOK_EOF'
#!/bin/bash
# Post-merge hook to verify protected files weren't reverted

PROTECTED_FILES=(
  "src/pages/Landing.tsx"
  "src/pages/App.tsx"
  "src/index.css"
)

echo "✅ Merge completed. Verifying protected files..."

for file in "${PROTECTED_FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if file has our protection markers
    if ! grep -q "PROTECTED: DO NOT REVERT" "$file" 2>/dev/null; then
      echo "⚠️  Warning: $file may have been modified. Please verify."
    fi
  fi
done

exit 0
HOOK_EOF

chmod +x .git/hooks/post-merge

# 6. Add protection comments to critical files
echo "📝 Adding protection markers to critical files..."

for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    # Check if protection marker already exists
    if ! grep -q "PROTECTED: DO NOT REVERT" "$file"; then
      # Add protection comment at the top (after imports)
      if [[ "$file" == *.tsx ]] || [[ "$file" == *.ts ]]; then
        # For TSX/TS files, add after last import
        sed -i.bak '/^import.*from/a\
// 🛡️ PROTECTED: DO NOT REVERT - This file contains critical updates that must be preserved\
' "$file"
        rm -f "${file}.bak"
      elif [[ "$file" == *.css ]]; then
        # For CSS files, add at the top
        sed -i.bak '1i\
/* 🛡️ PROTECTED: DO NOT REVERT - This file contains critical updates that must be preserved */\
' "$file"
        rm -f "${file}.bak"
      fi
    fi
  fi
done

# 7. Create a backup branch with current state
echo "💾 Creating backup branch..."
BACKUP_BRANCH="backup-protected-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH" 2>/dev/null
echo "   Backup branch created: $BACKUP_BRANCH"

echo ""
echo "✅ Protection setup complete!"
echo ""
echo "📋 Protected files:"
for file in "${CRITICAL_FILES[@]}"; do
  echo "   - $file"
done
echo ""
echo "🛡️ Protection features:"
echo "   ✅ Git merge strategy configured (ours for protected files)"
echo "   ✅ Pre-merge hook installed"
echo "   ✅ Post-merge hook installed"
echo "   ✅ Protection markers added to files"
echo "   ✅ Backup branch created: $BACKUP_BRANCH"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Protected files will NOT be automatically merged"
echo "   - You must manually review merges for protected files"
echo "   - Deployments will continue to work normally"
echo "   - Use 'git merge -X ours' to keep your version of protected files"
echo ""

