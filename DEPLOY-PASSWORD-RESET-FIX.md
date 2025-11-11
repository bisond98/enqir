# 🚀 Deploy Password Reset Fix to Live Site

## ✅ Code Changes Ready
- ✅ Fixed `AuthCallback.tsx` to handle password reset links
- ✅ Enhanced `ResetPassword.tsx` with better logging
- ✅ All code uses `window.location.origin` (works automatically in production)

## 📋 Pre-Deployment Checklist

### 1. Firebase Console Settings

**Go to Firebase Console → Authentication → Templates:**

#### Email Address Verification Template:
1. Click "Email address verification"
2. Click "Edit"
3. Check "Action URL" field
4. Should be: `https://enqir.in/auth/callback` OR `https://enqir.in/reset-password`
5. If not set, click "Customize action URL" and set to: `https://enqir.in/auth/callback`
6. Click "Save"

#### Password Reset Template:
1. Click "Password reset"
2. Click "Edit"
3. Check "Action URL" field
4. Should be: `https://enqir.in/reset-password` OR `https://enqir.in/auth/callback`
5. If not set, click "Customize action URL" and set to: `https://enqir.in/reset-password`
6. Click "Save"

**Note:** Either URL will work now because `AuthCallback` redirects password reset links to `/reset-password`.

### 2. Verify Authorized Domains

**Go to Firebase Console → Authentication → Settings → Authorized domains:**

Make sure these are listed:
- ✅ `localhost` (for local testing)
- ✅ `enqir.in`
- ✅ `www.enqir.in`

If missing, click "Add domain" and add them.

---

## 🚀 Deployment Steps

### Option 1: Deploy via GitHub (Recommended - Auto-deploys)

If your code is connected to GitHub and Vercel watches your repo:

```bash
# 1. Check current status
git status

# 2. Add all changes
git add .

# 3. Commit changes
git commit -m "Fix password reset link routing"

# 4. Push to GitHub
git push origin main
# OR
git push origin master

# 5. Vercel will automatically deploy in 1-2 minutes!
```

**Then:**
1. Go to https://vercel.com/dashboard
2. Find your project
3. Wait for deployment to complete (1-2 minutes)
4. Check deployment logs for any errors

---

### Option 2: Deploy via Vercel CLI

```bash
# 1. Make sure you're in the project directory
cd "/Users/nivedsunil/Desktop/enqir 1 copy 9 untested copy 4"

# 2. Build the project (test locally first)
npm run build

# 3. Deploy to production
vercel --prod
```

**Follow prompts:**
- Link to existing project? → **Yes**
- Select your project → Choose the one connected to `enqir.in`

---

### Option 3: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Find your project (the one connected to `enqir.in`)
3. Click "Deployments" tab
4. Click "Redeploy" on the latest deployment
5. Or click "Settings" → "Git" → "Redeploy"

---

## ✅ Post-Deployment Verification

### Test 1: Password Reset Flow

1. Go to https://enqir.in/forgot-password
2. Enter your email address
3. Click "Send Reset Link"
4. Check your email (and spam folder)
5. Click the reset link in the email
6. **Should go to:** `https://enqir.in/reset-password?oobCode=...`
7. **Should NOT go to:** sign up page
8. Enter new password
9. Confirm password reset works

### Test 2: Email Verification Flow

1. Sign up with a new email
2. Check email for verification link
3. Click verification link
4. **Should verify email and redirect to dashboard**

### Test 3: Check Browser Console

1. Open browser console (F12)
2. Try password reset
3. Look for these logs:
   - `🔐 Password reset link detected...`
   - `🔐 ResetPassword page loaded with...`
4. No errors should appear

---

## 🔍 Troubleshooting

### Issue: Still redirects to sign up page

**Check:**
1. Firebase Action URL is set correctly (see Step 1 above)
2. Browser cache - try incognito/private window
3. Check browser console for errors
4. Verify deployment completed successfully

### Issue: Link doesn't work

**Check:**
1. Authorized domains include `enqir.in`
2. Firebase template Action URL is correct
3. Try requesting a new reset email

### Issue: Email not sending

**Check:**
1. Firebase Console → Authentication → Users (see if user exists)
2. Check spam folder
3. Wait 1-2 minutes (emails can be delayed)
4. Check Firebase Console → Authentication → Templates (make sure enabled)

---

## 📝 What Changed

### Files Modified:
1. **`src/pages/AuthCallback.tsx`**
   - Added password reset mode detection
   - Redirects to `/reset-password` with `oobCode`

2. **`src/pages/ResetPassword.tsx`**
   - Added better logging
   - Improved error handling

### No Breaking Changes:
- ✅ All existing functionality preserved
- ✅ Email verification still works
- ✅ Sign in/sign up unchanged
- ✅ Production-ready (uses `window.location.origin`)

---

## 🎯 Quick Summary

1. ✅ **Update Firebase Action URLs** (if not already set)
2. ✅ **Deploy code** (via GitHub push or Vercel CLI)
3. ✅ **Test password reset** on live site
4. ✅ **Verify email verification** still works

**Estimated Time:** 5-10 minutes

---

## 📞 Need Help?

If deployment fails:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify Firebase settings are correct
4. Try deploying again

**Last Updated:** November 11, 2025

