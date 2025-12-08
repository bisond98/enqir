#!/bin/bash
# Remove file locking that blocks deployment

cd "/Users/nivedsunil/Desktop/enqir 1 copy 9 untested copy 4"

echo "Unlocking all files..."
git ls-files -v | grep '^h' | awk '{print $2}' | while read file; do
    [ -n "$file" ] && git update-index --no-assume-unchanged "$file" 2>/dev/null
done

echo "Removing file locking from hooks..."
# Ensure pre-commit and post-commit hooks don't lock files
rm -f .git/hooks/pre-commit
rm -f .git/hooks/post-commit

echo "✅ File locking removed. Deployment should work smoothly now."

