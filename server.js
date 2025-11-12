import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running',
    message: 'Razorpay payment backend for Enqir',
    endpoints: [
      'POST /createRazorpayOrder',
      'POST /verifyRazorpayPayment'
    ]
  });
});

// Create Razorpay order
app.post('/createRazorpayOrder', async (req, res) => {
  try {
    const { amount, currency = 'INR', enquiryId, userId, planId } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!enquiryId || !userId || !planId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create order options
    const options = {
      amount: amount, // Amount in paise (already converted in frontend)
      currency,
      receipt: `receipt_${enquiryId}_${Date.now()}`,
      notes: {
        enquiryId,
        userId,
        planId,
      },
    };

    // Create order with Razorpay
    const order = await razorpay.orders.create(options);
    
    console.log('✅ Order created successfully:', order.id);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message 
    });
  }
});

// Verify Razorpay payment
app.post('/verifyRazorpayPayment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      enquiryId,
      userId,
      planId,
      amount,
    } = req.body;

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing payment verification data' 
      });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('❌ Invalid signature');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payment signature' 
      });
    }

    // Payment verified successfully
    console.log('✅ Payment verified successfully:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      enquiryId,
      userId,
      planId,
      amount,
    });

    // Here you can add additional logic:
    // - Update database
    // - Send confirmation email
    // - Trigger webhooks
    // etc.

    res.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Payment verification failed',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Razorpay backend server running at http://localhost:${PORT}`);
  console.log(`📝 Razorpay Key ID: ${process.env.VITE_RAZORPAY_KEY_ID ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🔑 Razorpay Key Secret: ${process.env.RAZORPAY_KEY_SECRET ? '✅ Configured' : '❌ Not configured'}`);
});
