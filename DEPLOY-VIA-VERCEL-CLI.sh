#!/bin/bash

# Deploy directly via Vercel CLI - bypasses git entirely
echo "🚀 Deploying directly via Vercel CLI..."

cd "/Users/nivedsunil/Desktop/enqir 1 copy 9 untested copy 4"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel login..."
vercel whoami 2>&1 || {
    echo "⚠️  Not logged in. Please login:"
    vercel login
}

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod --yes

echo ""
echo "✅ Deployment initiated!"
echo "   Check status at: https://vercel.com/dashboard"

