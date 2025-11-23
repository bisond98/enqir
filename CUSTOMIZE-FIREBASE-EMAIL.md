# 📧 Customize Firebase Sign-In Email Template

## ✅ Domain URLs Verified
All email templates are correctly using `enqir.in` - no typo issues found!

---

## Current Email Template
The email you're seeing is the default Firebase "Email link (sign-in)" template. You can customize it in the Firebase Console.

---

## 🎯 How to Customize the Email Template

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com
2. Select your project: **pal-519d0**
3. Go to: **Authentication** → **Templates**

### Step 2: Find "Email link (sign-in)" Template
**Note:** You're currently viewing "Email address verification". To customize the sign-in email:
1. Scroll down in the templates list (on the left side)
2. Look for **"Email link (sign-in)"** (it should be below "Email address verification")
3. Click on it to select it
4. You'll see the template details on the right
5. Click **"Edit"** button (top right or bottom of the form)
6. You'll see these customizable fields:

#### **Email Subject:**
**Current:** `Sign in to pal-519d0 requested at 2025 November 23 07:32 UTC`  
**Change to:** `Sign in to Enqir`

Or keep the date format:
```
Sign in to Enqir requested at {{.Date}} {{.Time}} UTC
```

#### **Email Body:**
**Current message shows:**
```
Hello,

We received a request to sign in to pal-519d0 using this email address, at {{.Date}} {{.Time}} UTC. If you want to sign in with your {{.Email}} account, click this link:

{{.Link}}

If you did not request this link, you can safely ignore this email.

Thanks,

Your pal-519d0 team
```

**Change to:**
```
Hello,

We received a request to sign in to Enqir using this email address, at {{.Date}} {{.Time}} UTC. If you want to sign in with your {{.Email}} account, click this link:

{{.Link}}

If you did not request this link, you can safely ignore this email.

Thanks,

The Enqir Team
```

**Key changes:**
- Replace `pal-519d0` with `Enqir` (2 places)
- Replace `Your pal-519d0 team` with `The Enqir Team`

#### **Action URL:**
Make sure this is set to:
```
https://enqir.in/auth/callback
```
OR leave it as default (Firebase will use your authorized domain)

### Step 3: Available Variables
You can use these variables in your email template:

- `{{.Email}}` - User's email address
- `{{.Link}}` - Sign-in link (automatically inserted)
- `{{.Date}}` - Date of request
- `{{.Time}}` - Time of request
- `{{.ProjectName}}` - Your project name (currently "pal-519d0" - avoid using this, use "Enqir" instead)

### Step 4: Save Changes
1. Click **"Save"** at the bottom
2. Changes take effect immediately

---

## 📝 Suggested Custom Email Template

### Subject:
```
Sign in to Enqir
```

### Body (HTML):
```html
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
      <p>We received a request to sign in to Enqir using this email address, at {{.Date}} {{.Time}} UTC.</p>
      <p>If you want to sign in with your <strong>{{.Email}}</strong> account, click the button below:</p>
      <p style="text-align: center;">
        <a href="{{.Link}}" class="button">Sign in to Enqir</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #0066cc;">{{.Link}}</p>
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
```

### Body (Plain Text - Fallback):
```
Hello,

We received a request to sign in to Enqir using this email address, at {{.Date}} {{.Time}} UTC.

If you want to sign in with your {{.Email}} account, click this link:

{{.Link}}

This link will expire in 1 hour for security reasons.

If you did not request this link, you can safely ignore this email.

Thanks,
The Enqir Team
```

---

## 🎨 Customization Tips

### 1. **Brand Colors**
- Use your brand colors in the HTML template
- Current brand: Black (#000) background

### 2. **Logo**
- You can't directly embed images in Firebase email templates
- But you can use external image URLs if you host your logo
- Example: `<img src="https://enqir.in/logo.png" alt="Enqir">`

### 3. **Project Name**
- Change "pal-519d0" to "Enqir" everywhere
- Update the subject line
- Update the footer

### 4. **Support Email**
- Go to **Project Settings** → **Public settings**
- Set **Support email** to: `support@enqir.in` (or your support email)

---

## 🔍 Other Email Templates to Customize

While you're in the Templates section, you might also want to customize:

1. **Email address verification** - For new sign-ups
2. **Password reset** - For forgot password
3. **Email change verification** - When users change email

---

## ✅ Quick Checklist

### Customize Email Address Verification Template:
- [x] Action URL: `https://enqir.in/auth/callback` ✅ (already correct)
- [x] Subject: "Verify your email for Enqir" ✅ (already correct)
- [ ] Update message body to use "Enqir" instead of "%APP_NAME%" (optional)
- [ ] Save changes if you make any updates

### Customize Email Link (Sign-In) Template (URGENT - This is what you're receiving):
- [ ] Go to Firebase Console → Authentication → Templates
- [ ] Scroll down to find "Email link (sign-in)" template (below "Email address verification")
- [ ] Click "Email link (sign-in)" to select it
- [ ] Click "Edit" button
- [ ] **Subject:** Change from "Sign in to pal-519d0 requested at..." to "Sign in to Enqir requested at {{.Date}} {{.Time}} UTC"
- [ ] **Message body:** Replace ALL instances of:
  - `pal-519d0` → `Enqir` (2 places in the message)
  - `Your pal-519d0 team` → `The Enqir Team`
- [ ] Verify Action URL is correct: `https://enqir.in/auth/callback`
- [ ] Click "Save" button
- [ ] Test by requesting a sign-in link
- [ ] Verify email now shows "Enqir" instead of "pal-519d0"

---

## 🧪 Testing

After customizing:

1. Go to your sign-in page
2. Request a sign-in link
3. Check your email inbox
4. Verify the new template appears correctly
5. Test the sign-in link works

---

## 📞 Need Help?

If you need to customize other aspects:
- **Email domain**: Requires Firebase Blaze plan (paid)
- **SMTP settings**: Requires Firebase Blaze plan
- **Custom email service**: Can integrate SendGrid, Mailgun, etc. (requires code changes)

---

## 🚀 Next Steps

1. Customize the email template in Firebase Console
2. Test it with a real email
3. Deploy any code changes if needed
4. Monitor email delivery in Firebase Console → Authentication → Users

