#!/bin/bash

# Restore protection hooks after deployment
echo "🔒 Restoring protection hooks..."

# Restore hooks
mv .git/hooks/pre-merge.backup .git/hooks/pre-merge 2>/dev/null
mv .git/hooks/pre-rebase.backup .git/hooks/pre-rebase 2>/dev/null
mv .git/hooks/pre-pull.backup .git/hooks/pre-pull 2>/dev/null

# Restore git config protections
git config --local receive.denyNonFastForwards true
git config --local receive.denyDeletes true

echo "✅ Protection restored"

