# Deploy Firebase Cloud Functions - Quick Guide

## ✅ Setup Complete!

Firebase Cloud Functions are set up and ready to deploy. The frontend is already configured to use them.

## Next Steps to Deploy:

### 1. Login to Firebase (if not already logged in)
```bash
npx firebase login
```

### 2. Set Razorpay Environment Variables

Set your Razorpay credentials in Firebase Functions config:

```bash
npx firebase functions:config:set razorpay.key_id="YOUR_RAZORPAY_KEY_ID"
npx firebase functions:config:set razorpay.key_secret="YOUR_RAZORPAY_KEY_SECRET"
```

**Replace with your actual Razorpay credentials from your Razorpay dashboard.**

### 3. Deploy Functions

```bash
npx firebase deploy --only functions
```

This will deploy both functions:
- `createRazorpayOrder` - Creates Razorpay payment orders
- `verifyRazorpayPayment` - Verifies payment signatures

### 4. Verify Deployment

After deployment, you'll see URLs like:
```
✔ functions[createRazorpayOrder(us-central1)]: Successful create operation.
✔ functions[verifyRazorpayPayment(us-central1)]: Successful create operation.
```

The frontend is already configured to use:
- `https://us-central1-pal-519d0.cloudfunctions.net/createRazorpayOrder`
- `https://us-central1-pal-519d0.cloudfunctions.net/verifyRazorpayPayment`

## Benefits

✅ **No separate server needed** - Everything runs on Firebase  
✅ **Automatic scaling** - Firebase handles traffic  
✅ **No CORS issues** - Functions handle CORS automatically  
✅ **Free tier** - 2 million invocations/month free  
✅ **Integrated** - Same Firebase project as your app  

## Testing

After deployment, test the payment flow in your app. The functions will:
1. Create Razorpay orders securely
2. Verify payment signatures
3. Handle all CORS automatically

## Troubleshooting

**Functions not deploying?**
- Make sure you're logged in: `npx firebase login`
- Check project: `npx firebase use pal-519d0`

**Environment variables not working?**
- After setting config, redeploy: `npx firebase deploy --only functions`
- Check config: `npx firebase functions:config:get`

**Need to update functions?**
- Make changes in `functions/src/index.ts`
- Build: `cd functions && npm run build`
- Deploy: `npx firebase deploy --only functions`

