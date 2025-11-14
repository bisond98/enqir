 # Quick Deploy Guide

## Option 1: Use the Script (Easiest)

Run this command and follow the prompts:
```bash
./deploy-functions.sh
```

It will:
1. Check if you're logged into Firebase
2. Ask for your Razorpay credentials
3. Set them in Firebase Functions
4. Deploy the functions

---

## Option 2: Manual Steps

### Step 1: Login to Firebase
```bash
npx firebase login
```

### Step 2: Set Credentials
```bash
npx firebase functions:config:set razorpay.key_id="YOUR_KEY_ID"
npx firebase functions:config:set razorpay.key_secret="YOUR_KEY_SECRET"
```

### Step 3: Deploy
```bash
npx firebase deploy --only functions
```

---

## Where to Find Razorpay Credentials

1. Go to https://dashboard.razorpay.com
2. Settings → API Keys
3. Copy your Key ID and Key Secret

---

## After Deployment

Your functions will be available at:
- `https://us-central1-pal-519d0.cloudfunctions.net/createRazorpayOrder`
- `https://us-central1-pal-519d0.cloudfunctions.net/verifyRazorpayPayment`

The frontend is already configured to use these URLs! ✅

