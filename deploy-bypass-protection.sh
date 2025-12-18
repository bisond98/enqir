#!/bin/bash

# Temporarily disable protection hooks for deployment
echo "🔓 Temporarily disabling protection hooks for deployment..."

# Backup hooks
mv .git/hooks/pre-merge .git/hooks/pre-merge.backup 2>/dev/null
mv .git/hooks/pre-rebase .git/hooks/pre-rebase.backup 2>/dev/null
mv .git/hooks/pre-pull .git/hooks/pre-pull.backup 2>/dev/null

# Temporarily disable git config protections
git config --local receive.denyNonFastForwards false
git config --local receive.denyDeletes false

echo "✅ Protection temporarily disabled"
echo ""
echo "Now you can push:"
echo "  git add -A"
echo "  git commit -m 'Your message'"
echo "  git push origin main"
echo ""
echo "After deployment, run: restore-protection.sh"




