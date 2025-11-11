# 🔧 Firebase Email Verification & Password Reset - Troubleshooting Guide

## 🚨 Problem
Email verification and password reset emails are not being sent.

## ✅ Quick Fix Checklist

### Step 1: Check Firebase Console Settings

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `pal-519d0`
3. **Go to Authentication** → **Settings** → **Authorized domains**

**Add these domains:**
- `localhost` (should already be there)
- `enqir.in` (your live domain)
- `your-vercel-url.vercel.app` (if using Vercel)

### Step 2: Check Email Templates

1. **Go to Authentication** → **Templates**
2. **Check these templates:**
   - **Email address verification** - Should be enabled
   - **Password reset** - Should be enabled

3. **For each template:**
   - Click "Edit"
   - Check that "Action URL" is set correctly
   - For verification: Should point to your domain + `/auth/callback`
   - For password reset: Should point to your domain + `/reset-password`

### Step 3: Check Firebase Project Settings

1. **Go to Project Settings** (gear icon)
2. **Check "Public settings"**:
   - Project ID: `pal-519d0`
   - Support email: Should be set to your email
   - Authorized domains: Should include your domains

### Step 4: Check Firebase Billing (if needed)

**Free tier limits:**
- Firebase allows email sending on free tier
- But if you hit limits, emails may stop

**Check:**
1. Go to **Usage and billing**
2. Check if you've exceeded free tier limits

---

## 🔍 Common Issues & Solutions

### Issue 1: "Email not sending" - No error shown

**Solution:**
- Check spam/junk folder
- Wait 1-2 minutes (emails can be delayed)
- Check Firebase Console → Authentication → Users (see if user was created)

### Issue 2: "auth/too-many-requests"

**Solution:**
- Wait 5-10 minutes before trying again
- Firebase limits email sending to prevent abuse

### Issue 3: "auth/invalid-email"

**Solution:**
- Check email format is correct
- Make sure email doesn't have extra spaces

### Issue 4: Emails go to spam

**Solution:**
- This is normal for new Firebase projects
- Tell users to check spam folder
- Consider using custom email domain later

### Issue 5: "Action URL" not working

**Solution:**
1. Go to Authentication → Templates
2. Edit the template
3. Set Action URL to: `https://enqir.in/auth/callback` (for verification)
4. Or: `https://enqir.in/reset-password` (for password reset)

---

## 🧪 Testing Email Sending

### Test Sign Up:
1. Try signing up with a real email
2. Check browser console for errors
3. Check Firebase Console → Authentication → Users
4. Check email inbox (and spam)

### Test Password Reset:
1. Go to forgot password page
2. Enter email
3. Check browser console
4. Check email inbox (and spam)

---

## 🔧 Advanced: Custom Email Domain (Optional)

If you want to use your own email domain:

1. **Go to Authentication** → **Settings** → **Authorized domains**
2. **Add your custom domain**
3. **Configure DNS** (if needed)
4. **Update email templates** to use custom domain

---

## 📊 Check Email Status

### In Firebase Console:
1. Go to **Authentication** → **Users**
2. Find the user
3. Check "Email verified" status
4. Check "Provider" (should show email)

### In Browser Console:
Look for these messages:
- `📧 Attempting to send...`
- `✅ Email sent successfully`
- `❌ Email error: [error details]`

---

## 🚀 Quick Fix Steps

1. ✅ Check Firebase Console → Authentication → Settings → Authorized domains
2. ✅ Add `enqir.in` to authorized domains
3. ✅ Check Authentication → Templates are enabled
4. ✅ Test with a real email address
5. ✅ Check spam folder
6. ✅ Check browser console for errors

---

## 📞 Still Not Working?

**Check these:**
1. Firebase project is active (not suspended)
2. No billing issues
3. Email address is valid format
4. Not hitting rate limits
5. Authorized domains include your domain

**Common mistake:**
- Forgetting to add production domain to authorized domains
- Using wrong Action URL in email templates

---

## ✅ Verification

After fixing:
1. Sign up with a test email
2. Check email arrives within 2 minutes
3. Click verification link
4. Account should be verified

**Last Updated:** November 11, 2025

