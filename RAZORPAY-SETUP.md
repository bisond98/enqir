# Razorpay Integration Setup Guide

## 🎯 Overview
This guide will help you set up Razorpay payment gateway integration for enqir.in.

## 📋 Prerequisites
- ✅ Razorpay account with dashboard access
- ✅ Firebase project set up
- ✅ Node.js installed

## 🔑 Step 1: Get Razorpay Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **API Keys**
3. Generate API Keys (or use existing ones)
4. You'll get:
   - **Key ID** (public key - safe to use in frontend)
   - **Key Secret** (private key - NEVER expose in frontend)

## 🛠️ Step 2: Configure Environment Variables

1. Copy the template file:
   ```bash
   cp .env.template .env
   ```

2. Open `.env` and add your Razorpay credentials:
   ```env
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_secret_key_here
   VITE_API_URL=http://localhost:5001
   ```

3. **IMPORTANT**: Never commit `.env` to git (it's already in .gitignore)

## 🔥 Step 3: Set up Firebase Cloud Functions

### Install Firebase CLI (if not installed)
```bash
npm install -g firebase-tools
```

### Login to Firebase
```bash
firebase login
```

### Initialize Functions (if not already done)
```bash
firebase init functions
```

### Set Firebase Environment Variables
```bash
firebase functions:config:set razorpay.key_id="your_key_id" razorpay.key_secret="your_key_secret"
```

### Deploy Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## 🧪 Step 4: Test Integration

### Test Mode (Development)
Use Razorpay test cards:

**Success Card:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failure Card:**
- Card Number: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

### Production Mode
1. Switch to Live mode in Razorpay Dashboard
2. Update `.env` with live API keys (rzp_live_xxxxx)
3. Redeploy

## 🔒 Security Checklist

- [ ] Never expose Key Secret in frontend code
- [ ] Always verify payment signatures on backend
- [ ] Use HTTPS in production
- [ ] Keep `.env` file in `.gitignore`
- [ ] Set up webhook signatures for payment notifications
- [ ] Enable 2FA on Razorpay account

## 📊 Payment Flow

1. User selects a payment plan
2. Frontend creates order via Firebase function
3. Razorpay checkout opens
4. User completes payment
5. Backend verifies payment signature
6. Update Firestore with payment record
7. Activate premium features

## 🐛 Troubleshooting

### Issue: "Razorpay Key ID not configured"
- Check `.env` file exists and has correct keys
- Restart development server after adding env vars
- Ensure key starts with `rzp_test_` or `rzp_live_`

### Issue: "Payment verification failed"
- Check Key Secret is set correctly in Firebase
- Verify signature calculation matches Razorpay docs
- Check Firebase function logs: `firebase functions:log`

### Issue: "Order creation failed"
- Check Firebase functions are deployed
- Verify VITE_API_URL points to correct endpoint
- Check Firebase function permissions

## 📞 Support

- Razorpay Docs: https://razorpay.com/docs/
- Firebase Functions: https://firebase.google.com/docs/functions
- Contact: support@enqir.in

## 🎉 You're All Set!

Test a payment and verify it appears in:
1. Razorpay Dashboard → Payments
2. Firebase Console → Firestore → payments collection
3. Your app's dashboard

---

**Last Updated:** November 11, 2025
**Version:** 1.0.0

