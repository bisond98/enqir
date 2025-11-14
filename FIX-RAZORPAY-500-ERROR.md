# Fix Razorpay 500 Error

## The Problem
Getting a 500 error when trying to upgrade plans. The Firebase Cloud Function is failing to create Razorpay orders.

## Quick Fix Steps

### 1. Check if Razorpay credentials are configured:
```bash
npx firebase functions:config:get
```

### 2. If credentials are missing, set them:
```bash
npx firebase functions:config:set razorpay.key_id="rzp_test_ReLsZiGUph55kL"
npx firebase functions:config:set razorpay.key_secret="kQXPdX222tj4Tvz30Hujoi0O"
```

**Note:** Replace with your actual Razorpay credentials from your Razorpay dashboard.

### 3. Build and redeploy functions:
```bash
cd functions
npm run build
cd ..
npx firebase deploy --only functions
```

### 4. Verify deployment:
After deployment, check the Firebase Console → Functions → Logs to see if there are any errors.

## Alternative: Check Firebase Console

1. Go to Firebase Console → Functions
2. Click on `createRazorpayOrder` function
3. Check the "Logs" tab to see the actual error
4. Common errors:
   - "Razorpay credentials not configured" → Run step 2 above
   - "Invalid key" → Check your Razorpay credentials
   - Network errors → Check Razorpay API status

## Test After Fix

Try upgrading a plan again. The error should now show more details in the browser console if it still fails.

