# Firebase Cloud Functions Setup for Razorpay

## Prerequisites
1. Firebase CLI installed (already done via npm)
2. Firebase project: `pal-519d0`
3. Razorpay credentials

## Setup Steps

### 1. Install Functions Dependencies
```bash
cd functions
npm install
```

### 2. Configure Firebase Functions Environment Variables

Set your Razorpay credentials in Firebase Functions config:

```bash
npx firebase functions:config:set razorpay.key_id="YOUR_RAZORPAY_KEY_ID"
npx firebase functions:config:set razorpay.key_secret="YOUR_RAZORPAY_KEY_SECRET"
```

**Important:** Replace `YOUR_RAZORPAY_KEY_ID` and `YOUR_RAZORPAY_KEY_SECRET` with your actual Razorpay credentials.

### 3. Build Functions
```bash
cd functions
npm run build
```

### 4. Deploy Functions
```bash
# From project root
npx firebase deploy --only functions
```

### 5. Verify Deployment

After deployment, you'll get URLs like:
- `https://us-central1-pal-519d0.cloudfunctions.net/createRazorpayOrder`
- `https://us-central1-pal-519d0.cloudfunctions.net/verifyRazorpayPayment`

The frontend is already configured to use these URLs.

## Environment Variables Needed

### Firebase Functions Config
- `razorpay.key_id` - Your Razorpay Key ID
- `razorpay.key_secret` - Your Razorpay Key Secret

## Testing Locally (Optional)

To test functions locally before deploying:

```bash
cd functions
npm run serve
```

This will start the Firebase emulator. Update the frontend to use `http://localhost:5001` for local testing.

## Benefits of Using Firebase Functions

1. ✅ **No separate server** - Everything runs on Firebase
2. ✅ **Automatic scaling** - Firebase handles traffic spikes
3. ✅ **Integrated security** - Functions run in Firebase's secure environment
4. ✅ **No CORS issues** - Functions handle CORS automatically
5. ✅ **Free tier available** - 2 million invocations/month free
6. ✅ **Easy deployment** - One command to deploy

## Troubleshooting

### Functions not deploying?
- Make sure you're logged in: `npx firebase login`
- Check your project: `npx firebase use pal-519d0`

### Environment variables not working?
- After setting config, redeploy: `npx firebase deploy --only functions`
- Check config: `npx firebase functions:config:get`

### CORS errors?
- Functions already handle CORS, but if issues persist, check the function code

