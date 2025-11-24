# 📧 Custom Email Solution for Sign-In Links

## 🎯 Goal
Customize the sign-in email to show "Enqir" instead of "pal-519d0" while keeping the same smooth flow.

## ⚠️ Firebase Limitation
Firebase's "Email link (sign-in)" template **cannot be customized** in the Console. It always uses the Project ID "pal-519d0".

## ✅ Solution: Custom Email Service

To truly customize the email, we need to:
1. Generate the sign-in link using Firebase Admin SDK
2. Send a custom email using an email service (SendGrid, Mailgun, etc.)
3. Keep the same user flow - click link, sign in

---

## 🚀 Implementation Options

### Option 1: Use SendGrid (Recommended - Free tier available)

#### Step 1: Sign up for SendGrid
1. Go to https://sendgrid.com
2. Sign up (free tier: 100 emails/day)
3. Get your API key

#### Step 2: Install SendGrid
```bash
cd functions
npm install @sendgrid/mail
```

#### Step 3: Update Cloud Function
Add to `functions/src/index.ts`:

```typescript
import * as sgMail from '@sendgrid/mail';

// Set SendGrid API key
sgMail.setApiKey(functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY);

// Send custom sign-in email
export const sendCustomSignInLink = functions.https.onRequest(async (req, res): Promise<void> => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { email, continueUrl } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    // Generate sign-in link using Firebase Admin SDK
    const actionCodeSettings = {
      url: continueUrl || "https://enqir.in/auth/callback",
      handleCodeInApp: true,
    };

    const link = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);

    // Send custom email with "Enqir" branding
    const msg = {
      to: email,
      from: 'noreply@enqir.in', // Your verified sender email
      subject: 'Sign in to Enqir',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Enqir</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to sign in to Enqir using this email address.</p>
              <p>If you want to sign in with your <strong>${email}</strong> account, click the button below:</p>
              <p style="text-align: center;">
                <a href="${link}" class="button">Sign in to Enqir</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0066cc;">${link}</p>
              <p><small>This link will expire in 1 hour for security reasons.</small></p>
              <p>If you did not request this link, you can safely ignore this email.</p>
              <p>Thanks,<br>The Enqir Team</p>
            </div>
            <div class="footer">
              <p>© 2025 Enqir. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello,
        
        We received a request to sign in to Enqir using this email address.
        
        If you want to sign in with your ${email} account, click this link:
        
        ${link}
        
        This link will expire in 1 hour for security reasons.
        
        If you did not request this link, you can safely ignore this email.
        
        Thanks,
        The Enqir Team
      `,
    };

    await sgMail.send(msg);
    console.log("✅ Custom sign-in email sent to:", email);

    res.json({
      success: true,
      message: "Sign-in email sent",
    });
  } catch (error: any) {
    console.error("❌ Error sending custom sign-in email:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send sign-in email",
      details: error.message,
    });
  }
});
```

#### Step 4: Configure SendGrid API Key
```bash
firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY"
```

#### Step 5: Update Frontend
In `src/contexts/AuthContext.tsx`, replace `sendSignInLinkToEmail` with a call to your Cloud Function:

```typescript
// Instead of:
// await sendSignInLinkToEmail(auth, identifier, {...});

// Use:
const response = await fetch('https://us-central1-pal-519d0.cloudfunctions.net/sendCustomSignInLink', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: identifier,
    continueUrl: `${window.location.origin}/auth/callback`
  })
});
```

---

### Option 2: Use Mailgun (Alternative)

Similar setup but with Mailgun instead of SendGrid.

---

### Option 3: Accept Limitation (Simplest)

Keep using Firebase's default email. It works correctly, just shows "pal-519d0" instead of "Enqir".

---

## 📋 Quick Setup Checklist (SendGrid)

- [ ] Sign up for SendGrid account
- [ ] Verify sender email (noreply@enqir.in)
- [ ] Get API key
- [ ] Install `@sendgrid/mail` in functions
- [ ] Add Cloud Function code
- [ ] Set API key: `firebase functions:config:set sendgrid.api_key="KEY"`
- [ ] Deploy function: `firebase deploy --only functions:sendCustomSignInLink`
- [ ] Update frontend to call new function
- [ ] Test sign-in flow

---

## 🎯 Result

After implementation:
- ✅ Email shows "Enqir" branding
- ✅ Same smooth sign-in flow
- ✅ Custom email design
- ✅ Full control over email content

---

## 💡 Note

This solution requires:
- Setting up an email service (SendGrid/Mailgun)
- Deploying a Cloud Function
- Updating frontend code

But it gives you **full control** over the email content and branding!


