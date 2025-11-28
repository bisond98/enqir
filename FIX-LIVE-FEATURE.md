# Fix Feature Not Working on Live Site

## 🔍 Quick Diagnosis

If a feature works on localhost but not on the live site, it's usually one of these issues:

### Most Common: Missing Environment Variables in Vercel

## ✅ Step 1: Add Environment Variables to Vercel

### For Razorpay Payment Feature:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Sign in with your account

2. **Select Your Project:**
   - Find "enqir" or your project name
   - Click on it

3. **Go to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables" in sidebar

4. **Add Required Variables:**
   
   **Variable 1: Razorpay Key ID**
   - **Name:** `VITE_RAZORPAY_KEY_ID`
   - **Value:** `rzp_test_ReLsZiGUph55kL` (from your .env file)
   - **Environment:** Select "Production", "Preview", and "Development"
   - Click "Save"

   **Variable 2: API URL (if needed)**
   - **Name:** `VITE_API_URL`
   - **Value:** Your production API URL (or Firebase Functions URL)
   - **Environment:** Select "Production", "Preview", and "Development"
   - Click "Save"

5. **Redeploy:**
   - Go to "Deployments" tab
   - Click "..." (three dots) on latest deployment
   - Click "Redeploy"
   - OR push a new commit to trigger auto-deploy

## ✅ Step 2: Verify the Fix

1. **Wait for deployment to complete** (usually 1-2 minutes)
2. **Clear browser cache** or use incognito mode
3. **Test the feature** on the live site
4. **Check browser console** (F12) for any errors

## 🔍 Step 3: Check Browser Console for Errors

1. Open the live site
2. Press F12 (or right-click → Inspect)
3. Go to Console tab
4. Try to use the feature
5. Look for error messages

**Common Errors:**
- `Razorpay Key ID not configured` → Environment variable not set
- `Failed to create order` → Firebase Functions issue
- `Network error` → CORS or API endpoint issue
- `404 Not Found` → Route or function not deployed

## ✅ Step 4: Verify Firebase Functions (if using payments)

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

## 📋 Environment Variables Checklist

Make sure these are set in Vercel:

- ✅ `VITE_RAZORPAY_KEY_ID` - For payment feature
- ✅ `VITE_API_URL` - If using custom API endpoints
- ✅ Any other `VITE_*` variables used in your code

## 🚀 Quick Fix Summary

**Most Likely Issue:** Missing `VITE_RAZORPAY_KEY_ID` in Vercel

**Quick Fix:**
1. Add `VITE_RAZORPAY_KEY_ID` in Vercel Dashboard → Settings → Environment Variables
2. Set value to: `rzp_test_ReLsZiGUph55kL`
3. Select all environments (Production, Preview, Development)
4. Redeploy
5. Test the feature

## 📞 Still Not Working?

1. **Check which specific feature is broken:**
   - Payment/Razorpay?
   - Admin access?
   - Image uploads?
   - Something else?

2. **Check browser console** for specific error messages

3. **Verify the feature works locally** with the same data

4. **Check Vercel deployment logs** for build errors

## ✅ Verification Steps

After fixing, verify:
1. ✅ Feature works on live site
2. ✅ No console errors
3. ✅ All environment variables are set
4. ✅ Deployment completed successfully

If all ✅, you're good to go! 🎉









