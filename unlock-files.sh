#!/bin/bash
# Unlock ALL files to allow changes
# Usage: ./unlock-files.sh

echo "🔓 Unlocking ALL protected files..."

# Trust Badge Card Files
git update-index --no-assume-unchanged src/pages/PostEnquiry.tsx
git update-index --no-assume-unchanged src/pages/SellerResponse.tsx
git update-index --no-assume-unchanged src/pages/Profile.tsx

# Mobile Optimization Files
git update-index --no-assume-unchanged src/pages/Dashboard.tsx
git update-index --no-assume-unchanged src/pages/Landing.tsx

# CSS & Animation Files
git update-index --no-assume-unchanged src/index.css

# Configuration Files
git update-index --no-assume-unchanged vite.config.ts

# Hooks & Utilities
git update-index --no-assume-unchanged src/hooks/use-notification-preference.ts
git update-index --no-assume-unchanged src/hooks/useNetworkStatus.ts
git update-index --no-assume-unchanged src/utils/errorHandler.ts
git update-index --no-assume-unchanged src/utils/responsiveOptimization.ts

# Documentation Files
git update-index --no-assume-unchanged PROJECT-OVERVIEW.md
git update-index --no-assume-unchanged PREVENT-AUTO-REVERT.md
git update-index --no-assume-unchanged STRICT-PROTECTION.md
git update-index --no-assume-unchanged PROTECTION-STATUS.md

echo "✅ ALL files unlocked. Git will now track changes to these files."

