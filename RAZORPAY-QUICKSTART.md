# 🚀 Razorpay Integration - Quick Start Guide

## ✅ What's Been Done

Your application now has **full Razorpay payment gateway integration**! Here's what was implemented:

### Frontend Updates:
- ✅ Razorpay SDK integrated
- ✅ `paymentService.ts` updated with Razorpay payment processing
- ✅ `PaymentModal.tsx` updated to use Razorpay checkout
- ✅ Automatic payment verification
- ✅ Firestore integration for payment records

### Backend Updates:
- ✅ Express server (`server.js`) with Razorpay endpoints
- ✅ Order creation endpoint
- ✅ Payment verification endpoint with signature validation
- ✅ CORS enabled for frontend communication

---

## 🔧 Setup Steps (5 minutes)

### Step 1: Get Your Razorpay Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **API Keys**
3. Click **Generate Test Key** (or use existing)
4. You'll get:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (keep this secret!)

### Step 2: Create `.env` File

Create a `.env` file in your project root:

```bash
# Copy from template (if needed)
cp .env.template .env
```

Add your Razorpay credentials to `.env`:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here

# Backend API URL
VITE_API_URL=http://localhost:5001
```

**⚠️ IMPORTANT:** Never commit `.env` to git!

### Step 3: Start the Backend Server

Open a new terminal and run:

```bash
npm run server
```

You should see:
```
🚀 Razorpay backend server running at http://localhost:5001
📝 Razorpay Key ID: ✅ Configured
🔑 Razorpay Key Secret: ✅ Configured
```

### Step 4: Start the Frontend

In another terminal, run:

```bash
npm run dev
```

**OR** run both together:

```bash
npm run dev:full
```

---

## 🧪 Testing Your Integration

### Test Cards (Test Mode)

Use these cards in Razorpay's test checkout:

**✅ Success Card:**
- Card Number: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: Any future date (e.g., `12/25`)
- Name: Any name

**❌ Failure Card:**
- Card Number: `4000 0000 0000 0002`
- CVV: `123`
- Expiry: Any future date

### Other Test Payment Methods:
- **UPI:** Use `success@razorpay` for success
- **Net Banking:** Select any bank and complete test flow
- **Wallets:** All wallets work in test mode

### Testing Flow:

1. Go to your app (e.g., Post an enquiry)
2. Select a payment plan (Basic, Standard, or Premium)
3. Click "Pay with Razorpay"
4. Enter your name in the modal
5. Click "Pay ₹XX with Razorpay"
6. Razorpay checkout will open
7. Use test card details above
8. Complete payment
9. Verify payment success ✅

---

## 📊 How It Works

```
┌─────────────┐
│   User      │
│  Clicks Pay │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Frontend (PaymentModal)    │
│  - Calls createOrder API    │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Backend (server.js)        │
│  - Creates Razorpay order   │
│  - Returns order ID         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Razorpay Checkout Opens    │
│  - User enters card details │
│  - Completes payment        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Backend Verifies Payment   │
│  - Validates signature      │
│  - Confirms authenticity    │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Frontend Updates           │
│  - Saves to Firestore       │
│  - Activates premium        │
│  - Shows success message    │
└─────────────────────────────┘
```

---

## 🔍 Debugging

### Issue: "Razorpay Key ID not configured"

**Solution:**
1. Check `.env` file exists
2. Verify `VITE_RAZORPAY_KEY_ID` is set
3. Restart frontend server: `npm run dev`

### Issue: "Failed to create order"

**Solutions:**
1. Check backend server is running: `npm run server`
2. Verify `VITE_API_URL` in `.env` points to `http://localhost:5001`
3. Check backend logs for errors
4. Verify Razorpay credentials are correct

### Issue: "Payment verification failed"

**Solutions:**
1. Check `RAZORPAY_KEY_SECRET` in `.env`
2. Verify signature validation in backend logs
3. Ensure you're using matching test/live keys

### Check Backend Logs:

Backend server shows detailed logs:
- `✅` = Success
- `❌` = Error
- Look for specific error messages

---

## 🚀 Going Live (Production)

### Step 1: Activate Live Mode

1. Complete Razorpay KYC verification
2. Go to **Settings** → **API Keys**
3. Click **Generate Live Key**
4. Get Live credentials (start with `rzp_live_`)

### Step 2: Update Environment Variables

Update your production `.env`:

```env
# Production Razorpay Keys
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_secret_key

# Production API URL
VITE_API_URL=https://your-backend-domain.com
```

### Step 3: Deploy

1. Deploy backend to your hosting (Heroku, Railway, etc.)
2. Deploy frontend to Vercel/Netlify
3. Update `VITE_API_URL` to point to production backend
4. Test with real payment (small amount first!)

### Step 4: Verify

- Test real payment
- Check Razorpay Dashboard → Payments
- Verify Firestore updates
- Test refund process (if needed)

---

## 📝 Important Files

| File | Purpose |
|------|---------|
| `src/services/paymentService.ts` | Frontend payment logic |
| `src/components/PaymentModal.tsx` | Payment UI |
| `server.js` | Backend payment API |
| `.env` | Configuration (DO NOT COMMIT) |
| `.env.template` | Template for environment variables |

---

## 🔒 Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] Never expose Key Secret in frontend
- [ ] Always verify payment signatures on backend
- [ ] Use HTTPS in production
- [ ] Keep Razorpay SDK updated
- [ ] Enable webhooks for payment notifications
- [ ] Set up proper error monitoring
- [ ] Test refund flows

---

## 💡 Next Steps

### Optional Enhancements:

1. **Webhooks:** Set up Razorpay webhooks for real-time updates
2. **Email Notifications:** Send payment receipts
3. **Refund API:** Implement refund functionality
4. **Payment History:** Show user's past payments
5. **Analytics:** Track payment success rates

### Webhook Setup:

```javascript
// Add to server.js
app.post('/razorpay-webhook', (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  
  // Verify webhook signature
  const isValid = verifyWebhookSignature(req.body, signature, secret);
  
  if (isValid) {
    // Handle webhook events
    const event = req.body.event;
    // payment.authorized, payment.failed, etc.
  }
  
  res.json({ status: 'ok' });
});
```

---

## 📞 Support & Resources

- **Razorpay Docs:** https://razorpay.com/docs/
- **Test Cards:** https://razorpay.com/docs/payments/payments/test-card-details/
- **Webhooks:** https://razorpay.com/docs/webhooks/
- **Support:** Dashboard → Support

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Test payment works end-to-end
- [ ] Payment records saved to Firestore
- [ ] Premium features activated after payment
- [ ] Error handling works (failed payments)
- [ ] Backend server is secure
- [ ] Environment variables are set correctly
- [ ] Both frontend and backend are deployed
- [ ] SSL/HTTPS enabled in production
- [ ] Test refund process
- [ ] Monitor first few live transactions

---

**🎉 Congratulations!** Your Razorpay integration is complete and ready to use!

Need help? Check the logs, read the docs, or contact support.

---

**Version:** 1.0.0  
**Last Updated:** November 11, 2025  
**Integration Status:** ✅ Complete

