# 🔧 Fix "Sign in to pal-519d0" Email Template Issue

## 🚨 Problem
The "Email link (sign-in)" template cannot be customized in Firebase Console and still shows "pal-519d0" instead of "Enqir".

## ⚠️ Limitation
Firebase's "Email link (sign-in)" template is **NOT editable** in the Firebase Console UI. It automatically uses the Project ID ("pal-519d0") which cannot be changed.

---

## ✅ Solution Options

### Option 1: Use Firebase Admin SDK (Recommended - Requires Backend)

Customize the email template using Firebase Admin SDK in your backend code.

#### Step 1: Install Firebase Admin SDK
```bash
npm install firebase-admin
```

#### Step 2: Create Admin Function
Create a Firebase Cloud Function or backend endpoint that customizes the email:

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

// Customize email template
async function sendCustomSignInLink(email, actionCodeSettings) {
  const actionCodeSettings = {
    url: 'https://enqir.in/auth/callback',
    handleCodeInApp: true,
  };

  // Generate custom email with "Enqir" branding
  const link = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
  
  // Send custom email using your email service (SendGrid, Mailgun, etc.)
  // This allows full control over email content
}
```

**Note:** This requires setting up a custom email service (SendGrid, Mailgun, etc.) since Firebase Admin SDK doesn't send emails directly.

---

### Option 2: Use Email Verification Instead (Simpler)

Switch from email link sign-in to regular email verification, which **IS** customizable in Firebase Console.

#### Changes Needed:

1. **In your code** (`src/contexts/AuthContext.tsx`):
   - Instead of `sendSignInLinkToEmail`, use `sendEmailVerification`
   - This uses the "Email address verification" template (which you CAN customize)

2. **Customize the "Email address verification" template:**
   - Go to Firebase Console → Authentication → Templates
   - Click "Email address verification"
   - Edit subject and message to say "Enqir" instead of "%APP_NAME%"
   - This template IS editable!

---

### Option 3: Accept the Limitation (Quickest)

Since the Project ID "pal-519d0" cannot be changed, you have two choices:

1. **Accept it:** The email will always show "pal-519d0" in the subject/body
2. **Note in your app:** Add a message like "You'll receive an email from pal-519d0 - this is our Firebase project ID"

---

### Option 4: Use Custom Email Service (Most Control)

Replace Firebase's email sending with your own email service:

1. **Set up SendGrid/Mailgun/etc.**
2. **Create custom email templates** with "Enqir" branding
3. **Modify your sign-up flow** to send emails via your service instead of Firebase
4. **Use Firebase only for authentication**, not email sending

---

## 🎯 Recommended Approach

**For now (Quick fix):**
- Accept that the email will show "pal-519d0" 
- The email still works correctly
- Users can still sign in successfully

**For later (Proper fix):**
- Set up Firebase Admin SDK with custom email service
- OR switch to email verification (which is customizable)
- OR implement your own email sending service

---

## 📝 Current Status

- ✅ Project name changed to "Enqir" (doesn't affect email link template)
- ❌ "Email link (sign-in)" template not editable in Console
- ✅ "Email address verification" template IS editable (if you switch to it)
- ✅ Email links still work correctly (just shows "pal-519d0")

---

## 🔍 Why This Happens

Firebase's email link sign-in uses the Project ID ("pal-519d0") which is:
- Permanent and cannot be changed
- Used in the default email template
- Not customizable through the Console UI

This is a known Firebase limitation for the email link feature.

---

## 💡 Alternative: Update User-Facing Messages

While you can't change the email template, you can:

1. **Update your app's UI messages:**
   - "You'll receive a sign-in email from pal-519d0 (our authentication provider)"
   - Make it clear this is expected

2. **Use email verification instead:**
   - More customizable
   - Better user experience
   - Can fully brand as "Enqir"

---

## 🚀 Next Steps

1. **Decide:** Accept limitation OR implement custom solution
2. **If accepting:** Update app UI to explain the email sender
3. **If customizing:** Set up Firebase Admin SDK + email service
4. **Test:** Ensure sign-in still works regardless of email branding



