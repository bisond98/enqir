# SendGrid Setup for Custom Sign-In Emails

This guide explains how to set up SendGrid to send custom sign-in emails with "enqir.in" branding instead of Firebase's default "pal-519d0" template.

## Overview

The app now attempts to send custom sign-in emails via SendGrid with "enqir.in" branding. If SendGrid is not configured or fails, it automatically falls back to Firebase's default email template, ensuring emails are always sent.

## Setup Steps

### 1. Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for a free account (100 emails/day free tier)
3. Verify your email address

### 2. Create API Key

1. In SendGrid dashboard, go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it: `firebase-functions`
4. Select **Full Access** permissions
5. Click **Create & View**
6. **Copy the API key** (you won't be able to see it again!)

### 3. Verify Sender Email

1. In SendGrid dashboard, go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in the form:
   - **From Email Address**: `noreply@enqir.in`
   - **From Name**: `enqir.in`
   - **Reply To**: `noreply@enqir.in`
   - **Company Address**: Your company address
   - **City**: Your city
   - **State**: Your state
   - **Country**: Your country
   - **Zip Code**: Your zip code
4. Click **Create**
5. Check your email (`noreply@enqir.in`) and click the verification link

### 4. Configure Firebase Functions

Run this command in your terminal (replace `YOUR_SENDGRID_API_KEY` with the actual API key):

```bash
firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY"
```

### 5. Deploy Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## How It Works

1. **User signs up** → Frontend calls Cloud Function `sendCustomSignInLink`
2. **Cloud Function**:
   - Generates Firebase sign-in link
   - If SendGrid is configured → Sends custom email with "enqir.in" branding
   - If SendGrid fails → Falls back to Firebase default email
3. **Frontend fallback**: If Cloud Function fails, uses Firebase `sendSignInLinkToEmail` directly

## Testing

1. Sign up with a test email
2. Check your inbox:
   - **If SendGrid is configured**: You'll receive an email with "enqir.in" branding
   - **If SendGrid is not configured**: You'll receive Firebase's default email (with "pal-519d0")

## Troubleshooting

### Emails not sending via SendGrid

- Check Firebase Functions logs: `firebase functions:log`
- Verify API key is set: `firebase functions:config:get`
- Ensure sender email (`noreply@enqir.in`) is verified in SendGrid
- Check SendGrid dashboard for delivery status

### Fallback to Firebase default

This is **normal** if:
- SendGrid API key is not configured
- SendGrid API key is invalid
- SendGrid quota is exceeded
- Network issues

The app will automatically use Firebase's default email template, so users will always receive sign-in emails.

## Important Notes

- **No breaking changes**: If SendGrid fails, the app automatically uses Firebase default emails
- **Existing features unaffected**: All other email functionality (password reset, verification) remains unchanged
- **Free tier**: SendGrid free tier allows 100 emails/day, which should be sufficient for most use cases




