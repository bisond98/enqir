import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

// Initialize Firebase Admin
admin.initializeApp();

// Import Razorpay using require (CommonJS)
const Razorpay = require("razorpay");

// Initialize Razorpay lazily (only when needed)
const getRazorpayInstance = (): any => {
  try {
    const razorpayConfig = functions.config().razorpay;
    if (!razorpayConfig || !razorpayConfig.key_id || !razorpayConfig.key_secret) {
      console.error("❌ Razorpay credentials not configured in Firebase Functions");
      throw new Error("Razorpay credentials not configured. Please run: firebase functions:config:set razorpay.key_id=\"YOUR_KEY\" razorpay.key_secret=\"YOUR_SECRET\"");
    }
    const razorpay = new Razorpay({
      key_id: razorpayConfig.key_id,
      key_secret: razorpayConfig.key_secret,
    });
    console.log("✅ Razorpay initialized successfully");
    return razorpay;
  } catch (error: any) {
    console.error("❌ Failed to initialize Razorpay:", error.message);
    throw error;
  }
};

// Create Razorpay order
export const createRazorpayOrder = functions.https.onRequest(async (req, res): Promise<void> => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { amount, currency = "INR", enquiryId, userId, planId } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }

    if (!enquiryId || !userId || !planId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
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

    // Get Razorpay instance and create order
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);

    console.log("✅ Order created successfully:", order.id);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("❌ Error creating order:", error);
    const errorMessage = error.message || "Unknown error";
    const errorDetails = {
      error: "Failed to create order",
      details: errorMessage,
      ...(error.response && { razorpayError: error.response }),
    };
    console.error("❌ Full error details:", errorDetails);
    res.status(500).json(errorDetails);
  }
});

// Verify Razorpay payment
export const verifyRazorpayPayment = functions.https.onRequest(async (req, res): Promise<void> => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

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
      res.status(400).json({
        success: false,
        error: "Missing payment verification data",
      });
      return;
    }

    // Get Razorpay key secret from functions config
    const razorpayKeySecret = functions.config().razorpay.key_secret;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ Invalid signature");
      res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
      return;
    }

    // Payment verified successfully
    console.log("✅ Payment verified successfully:", {
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
      message: "Payment verified successfully",
    });
  } catch (error: any) {
    console.error("❌ Error verifying payment:", error);
    res.status(500).json({
      success: false,
      error: "Payment verification failed",
      details: error.message,
    });
  }
});

