#!/bin/bash

cd "/Users/nivedsunil/Desktop/enqir 1 copy 9 untested copy 4"

echo "=========================================="
echo "🚀 DEPLOYING ALL LATEST UPDATES"
echo "=========================================="
echo ""

# Check status
echo "📊 Current status:"
git status --short
echo ""

# Add all changes
echo "📦 Adding all changes..."
git add -A
echo "✅ Added"
echo ""

# Commit
echo "💾 Committing changes..."
git commit -m "Deploy: All latest updates - home screen cards, response cards, search bars" 2>&1
COMMIT_RESULT=$?
if [ $COMMIT_RESULT -eq 0 ]; then
    echo "✅ Committed successfully"
else
    echo "⚠️  No changes to commit (may already be committed)"
fi
echo ""

# Push
echo "🚀 Pushing to GitHub..."
git push origin main 2>&1
PUSH_RESULT=$?
echo ""

if [ $PUSH_RESULT -eq 0 ]; then
    echo "=========================================="
    echo "✅ SUCCESS! Changes pushed to GitHub"
    echo "=========================================="
    echo ""
    echo "📊 Check GitHub: https://github.com/bisond98/enqir/commits/main"
    echo "🌐 Check Vercel: https://vercel.com/dashboard"
    echo ""
    echo "Vercel should auto-deploy within 1-2 minutes!"
else
    echo "=========================================="
    echo "❌ PUSH FAILED"
    echo "=========================================="
    echo ""
    echo "Please check the error above and try again."
fi




