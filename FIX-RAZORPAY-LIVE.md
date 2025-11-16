# Fix Razorpay Not Working on Live Site

## 🔍 Quick Diagnosis

If Razorpay works on localhost but not on the live site (enqir.in), check these:

### Step 1: Check Browser Console
1. Open https://enqir.in
2. Press F12 (or right-click → Inspect)
3. Go to Console tab
4. Try to make a payment
5. Look for error messages

**Common Errors:**
- `Razorpay Key ID not configured` → Missing environment variable
- `Failed to create order` → Firebase Functions issue
- `Network error` → CORS or Functions not deployed

---

## ✅ Fix 1: Add Environment Variable in Vercel

The most common issue is missing `VITE_RAZORPAY_KEY_ID` in Vercel.

### Steps:
1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Sign in with your account

2. **Select Your Project:**
   - Find "enqir" project
   - Click on it

3. **Go to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables" in sidebar

4. **Add Variable:**
   - Click "Add New"
   - **Name:** `VITE_RAZORPAY_KEY_ID`
   - **Value:** Your Razorpay Key ID (starts with `rzp_test_` or `rzp_live_`)
   - **Environment:** Select "Production", "Preview", and "Development"
   - Click "Save"

5. **Redeploy:**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - OR push a new commit to trigger auto-deploy

---

## ✅ Fix 2: Verify Firebase Functions Are Deployed

### Check Functions Status:
1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com
   - Select project: `pal-519d0`

2. **Check Functions:**
   - Go to "Functions" in left sidebar
   - Look for:
     - `createRazorpayOrder`
     - `verifyRazorpayPayment`
   - Both should show "Active" status

3. **If Functions Are Missing:**
   ```bash
   # From project root
   npx firebase login
   npx firebase deploy --only functions
   ```

---

## ✅ Fix 3: Verify Firebase Functions Configuration

### Check Razorpay Credentials in Firebase:
```bash
# Check current config
npx firebase functions:config:get

# If missing, set them:
npx firebase functions:config:set razorpay.key_id="YOUR_KEY_ID"
npx firebase functions:config:set razorpay.key_secret="YOUR_KEY_SECRET"

# Redeploy functions
npx firebase deploy --only functions
```

---

## ✅ Fix 4: Test Firebase Functions Directly

### Test Order Creation:
Open this URL in browser:
```
https://us-central1-pal-519d0.cloudfunctions.net/createRazorpayOrder
```

**Expected:**
- If you see `Method not allowed` → Function is working ✅
- If you see `404 Not Found` → Function not deployed ❌
- If you see `500 Internal Server Error` → Credentials not configured ❌

### Test with Postman/curl:
```bash
curl -X POST https://us-central1-pal-519d0.cloudfunctions.net/createRazorpayOrder \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "INR",
    "enquiryId": "test",
    "userId": "test",
    "planId": "basic"
  }'
```

**Expected Response:**
```json
{
  "orderId": "order_xxxxx",
  "amount": 10000,
  "currency": "INR"
}
```

**If Error:**
- Check Firebase Functions logs
- Verify Razorpay credentials are set

---

## 🔍 Debug Checklist

### Check These in Browser Console:

1. **Razorpay Script Loading:**
   ```javascript
   // In browser console
   console.log(window.Razorpay);
   // Should show: function or object
   // If undefined: Script not loading
   ```

2. **Environment Variable:**
   ```javascript
   // Check if variable is accessible (won't work in console, but check Network tab)
   // Look for any requests to Firebase Functions
   ```

3. **Network Requests:**
   - Open Network tab in DevTools
   - Try to make payment
   - Look for request to `createRazorpayOrder`
   - Check status code:
     - `200` = Success ✅
     - `404` = Function not found ❌
     - `500` = Server error (check credentials) ❌
     - `CORS error` = Functions CORS not configured ❌

---

## 🚀 Quick Fix Summary

**Most Likely Issue:** Missing `VITE_RAZORPAY_KEY_ID` in Vercel

**Quick Fix:**
1. Add `VITE_RAZORPAY_KEY_ID` in Vercel Dashboard
2. Redeploy
3. Test payment

**If Still Not Working:**
1. Check Firebase Functions are deployed
2. Check Firebase Functions config has Razorpay credentials
3. Check browser console for specific errors
4. Test Firebase Functions URL directly

---

## 📞 Need More Help?

Check these files for more details:
- `DEPLOY-FIREBASE-FUNCTIONS.md` - How to deploy functions
- `RAZORPAY-SETUP.md` - Complete setup guide
- `QUICK-DEPLOY.md` - Quick deployment steps

---

## ✅ Verification Steps

After fixing, verify:
1. ✅ Payment button opens Razorpay modal
2. ✅ Can enter card details
3. ✅ Payment processes successfully
4. ✅ Success message appears
5. ✅ Enquiry is upgraded

If all ✅, you're good to go! 🎉

