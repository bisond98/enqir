#!/bin/bash
# Lock ALL critical files to prevent automatic reversions
# Usage: ./lock-files.sh

echo "🔒 Locking ALL critical files to prevent auto-reversion..."

# Trust Badge Card Files (Recent Updates)
git update-index --assume-unchanged src/pages/PostEnquiry.tsx
git update-index --assume-unchanged src/pages/SellerResponse.tsx
git update-index --assume-unchanged src/pages/Profile.tsx

# Mobile Optimization Files
git update-index --assume-unchanged src/pages/Dashboard.tsx
git update-index --assume-unchanged src/pages/Landing.tsx

# CSS & Animation Files
git update-index --assume-unchanged src/index.css

# Configuration Files
git update-index --assume-unchanged vite.config.ts

# Hooks & Utilities
git update-index --assume-unchanged src/hooks/use-notification-preference.ts
git update-index --assume-unchanged src/hooks/useNetworkStatus.ts
git update-index --assume-unchanged src/utils/errorHandler.ts
git update-index --assume-unchanged src/utils/responsiveOptimization.ts

# Documentation Files
git update-index --assume-unchanged PROJECT-OVERVIEW.md
git update-index --assume-unchanged PREVENT-AUTO-REVERT.md
git update-index --assume-unchanged STRICT-PROTECTION.md
git update-index --assume-unchanged PROTECTION-STATUS.md

echo "✅ ALL critical files locked. Git will ignore changes to these files."
echo "💡 To unlock: ./unlock-files.sh"
echo ""
echo "📋 Locked files:"
echo "   - Trust Badge: PostEnquiry, SellerResponse, Profile"
echo "   - Mobile: Dashboard, Landing"
echo "   - Styles: index.css"
echo "   - Config: vite.config.ts"
echo "   - Hooks & Utils: All recent updates"
echo "   - Docs: All protection guides"

