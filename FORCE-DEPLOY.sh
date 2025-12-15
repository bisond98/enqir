#!/bin/bash

cd "/Users/nivedsunil/Desktop/enqir 1 copy 9 untested copy 4"

echo "=========================================="
echo "🚀 FORCE DEPLOY TO VERCEL"
echo "=========================================="
echo ""

# Step 1: Ensure all changes are committed
echo "Step 1: Staging and committing changes..."
git add -A
git commit -m "Deploy: All latest updates - $(date +%Y%m%d-%H%M%S)" 2>&1
echo ""

# Step 2: Push to GitHub
echo "Step 2: Pushing to GitHub..."
git push origin main 2>&1
PUSH_EXIT=$?
echo ""

if [ $PUSH_EXIT -eq 0 ]; then
    echo "✅ Push successful!"
    echo ""
    echo "Step 3: Checking Vercel CLI..."
    if command -v vercel &> /dev/null; then
        echo "✅ Vercel CLI found"
        echo ""
        echo "Step 4: Deploying directly to Vercel..."
        vercel --prod --yes 2>&1
    else
        echo "⚠️  Vercel CLI not installed"
        echo ""
        echo "To install: npm install -g vercel"
        echo "Then run: vercel login"
        echo "Then run: vercel --prod"
    fi
else
    echo "❌ Push failed!"
    echo ""
    echo "Please check:"
    echo "1. GitHub authentication"
    echo "2. Network connection"
    echo "3. Git remote URL: $(git remote get-url origin)"
fi

echo ""
echo "=========================================="
echo "📊 Check deployment status:"
echo "GitHub: https://github.com/bisond98/enqir/commits/main"
echo "Vercel: https://vercel.com/dashboard"
echo "=========================================="

