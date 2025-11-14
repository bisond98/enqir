#!/bin/bash

# Firebase Functions Deployment Script
# This script helps deploy Razorpay functions to Firebase

echo "🚀 Firebase Functions Deployment"
echo "================================"
echo ""

# Check if Firebase CLI is logged in
echo "📋 Checking Firebase login status..."
if npx firebase projects:list &>/dev/null; then
    echo "✅ Firebase CLI is logged in"
else
    echo "❌ Firebase CLI not logged in"
    echo "Please run: npx firebase login"
    exit 1
fi

echo ""
echo "📝 Setting Razorpay credentials..."
echo "Please enter your Razorpay credentials:"
echo ""

read -p "Razorpay Key ID: " RAZORPAY_KEY_ID
read -sp "Razorpay Key Secret: " RAZORPAY_KEY_SECRET
echo ""

if [ -z "$RAZORPAY_KEY_ID" ] || [ -z "$RAZORPAY_KEY_SECRET" ]; then
    echo "❌ Error: Both credentials are required"
    exit 1
fi

echo ""
echo "🔧 Setting Firebase Functions config..."
npx firebase functions:config:set razorpay.key_id="$RAZORPAY_KEY_ID"
npx firebase functions:config:set razorpay.key_secret="$RAZORPAY_KEY_SECRET"

if [ $? -eq 0 ]; then
    echo "✅ Credentials set successfully"
    echo ""
    echo "🚀 Deploying functions..."
    npx firebase deploy --only functions
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "Your functions are now live at:"
        echo "  - https://us-central1-pal-519d0.cloudfunctions.net/createRazorpayOrder"
        echo "  - https://us-central1-pal-519d0.cloudfunctions.net/verifyRazorpayPayment"
    else
        echo "❌ Deployment failed"
        exit 1
    fi
else
    echo "❌ Failed to set credentials"
    exit 1
fi

