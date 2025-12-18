#!/bin/bash
cd "/Users/nivedsunil/Desktop/enqir 1 copy 9 untested copy 4"

echo "📝 Staging changes..."
git add -A

echo "📝 Committing..."
git commit -m "Deploy: EnquiryResponsesPage updates - sort oldest first, thin borders, Seller text"

echo "📝 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Push complete! Check GitHub: https://github.com/bisond98/enqir/commits/main"
echo "   Vercel should auto-deploy in 1-2 minutes"




