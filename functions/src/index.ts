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
    console.log("📥 Received request body:", JSON.stringify(req.body));
    
    const { amount, currency = "INR", enquiryId, userId, planId } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      console.error("❌ Invalid amount:", amount);
      res.status(400).json({ error: "Invalid amount", receivedAmount: amount });
      return;
    }

    if (!enquiryId || !userId || !planId) {
      console.error("❌ Missing required fields:", { enquiryId, userId, planId });
      res.status(400).json({ error: "Missing required fields", received: { enquiryId, userId, planId } });
      return;
    }

    console.log("✅ Input validation passed:", { amount, currency, enquiryId, userId, planId });

    // Create order options
    // Receipt must be max 40 characters - use short hash of enquiryId + timestamp
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const shortEnquiryId = enquiryId.length > 20 ? enquiryId.slice(-20) : enquiryId; // Last 20 chars if too long
    const receipt = `r_${shortEnquiryId}_${timestamp}`.slice(0, 40); // Max 40 chars
    
    const options = {
      amount: amount, // Amount in paise (already converted in frontend)
      currency,
      receipt: receipt,
      notes: {
        enquiryId,
        userId,
        planId,
      },
    };

    console.log("📦 Creating Razorpay order with options:", JSON.stringify(options));

    // Get Razorpay instance and create order
    let razorpay;
    try {
      razorpay = getRazorpayInstance();
      console.log("✅ Razorpay instance obtained");
    } catch (initError: any) {
      console.error("❌ Failed to get Razorpay instance:", initError);
      res.status(500).json({
        error: "Failed to initialize Razorpay",
        details: initError.message,
      });
      return;
    }

    let order;
    try {
      order = await razorpay.orders.create(options);
      console.log("✅ Order created successfully:", order.id);
    } catch (razorpayError: any) {
      console.error("❌ Razorpay API error:", razorpayError);
      console.error("❌ Razorpay error details:", JSON.stringify(razorpayError, null, 2));
      res.status(500).json({
        error: "Failed to create order with Razorpay",
        details: razorpayError.message || "Unknown Razorpay error",
        razorpayError: razorpayError.error || razorpayError.description || razorpayError,
      });
      return;
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("❌ Unexpected error creating order:", error);
    console.error("❌ Error stack:", error.stack);
    const errorMessage = error.message || "Unknown error";
    const errorDetails = {
      error: "Failed to create order",
      details: errorMessage,
      ...(error.response && { razorpayError: error.response }),
    };
    console.error("❌ Full error details:", JSON.stringify(errorDetails, null, 2));
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

