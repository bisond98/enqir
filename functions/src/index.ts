import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import * as sgMail from "@sendgrid/mail";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize SendGrid (will be set if API key is configured)
let sendGridInitialized = false;
const initializeSendGrid = (): boolean => {
  if (sendGridInitialized) return true;
  
  try {
    const sendGridApiKey = functions.config().sendgrid?.api_key;
    if (sendGridApiKey) {
      sgMail.setApiKey(sendGridApiKey);
      sendGridInitialized = true;
      console.log("✅ SendGrid initialized successfully");
      return true;
    } else {
      console.log("⚠️ SendGrid API key not configured - will use Firebase default emails");
      return false;
    }
  } catch (error: any) {
    console.error("❌ Failed to initialize SendGrid:", error.message);
    return false;
  }
};

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

// Send custom sign-in email link with "enqir.in" branding
export const sendCustomSignInLink = functions.https.onRequest(async (req, res): Promise<void> => {
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
    const { email, continueUrl } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const callbackUrl = continueUrl || "https://enqir.in/auth/callback";

    // Generate sign-in link using Firebase Admin SDK
    // Note: generateSignInWithEmailLink returns the link string (doesn't send email automatically)
    const actionCodeSettings = {
      url: callbackUrl,
      handleCodeInApp: true,
    };

    let signInLink: string;
    try {
      // Firebase Admin SDK method to generate sign-in link
      signInLink = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
      console.log("✅ Sign-in link generated for:", email);
    } catch (linkError: any) {
      console.error("❌ Error generating sign-in link:", linkError);
      // If link generation fails, fall back to Firebase default email sending
      throw new Error(`Failed to generate sign-in link: ${linkError.message}`);
    }

    // Try to send custom email via SendGrid
    const sendGridAvailable = initializeSendGrid();
    
    if (sendGridAvailable) {
      try {
        // Format current date/time
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        const timeStr = now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          timeZone: 'UTC',
          timeZoneName: 'short'
        });

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sign in to enqir.in</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #1a1a1a; margin-top: 0;">Hello,</h1>
              <p>We received a request to sign in to <strong>enqir.in</strong> using this email address, at ${dateStr} ${timeStr}.</p>
              <p>If you want to sign in with your <strong>${email}</strong> account, click this link:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signInLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: 600;">Sign in to enqir.in</a>
              </div>
              <p style="color: #666; font-size: 14px;">If you did not request this link, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; margin-bottom: 0;">Thanks,<br>Your enqir.in team</p>
            </div>
          </body>
          </html>
        `;

        const emailText = `
Hello,

We received a request to sign in to enqir.in using this email address, at ${dateStr} ${timeStr}.

If you want to sign in with your ${email} account, click this link:
${signInLink}

If you did not request this link, you can safely ignore this email.

Thanks,
Your enqir.in team
        `;

        const msg = {
          to: email,
          from: {
            email: 'noreply@enqir.in',
            name: 'enqir.in'
          },
          subject: `Sign in to enqir.in requested at ${dateStr} ${timeStr}`,
          text: emailText,
          html: emailHtml,
        };

        await sgMail.send(msg);
        console.log("✅ Custom email sent via SendGrid to:", email);

    res.json({
      success: true,
      message: "Sign-in email sent",
          sentVia: "sendgrid"
        });
        return;
      } catch (sendGridError: any) {
        console.error("❌ SendGrid error:", sendGridError);
        // Return error so frontend can fall back to Firebase default
        console.log("⚠️ SendGrid failed, returning error for frontend fallback...");
        res.status(500).json({
          success: false,
          error: "SendGrid email failed",
          details: sendGridError.message || "Failed to send email via SendGrid",
          note: "Frontend should fall back to Firebase default email"
        });
        return;
      }
    }

    // If SendGrid is not available, return error so frontend uses Firebase default
    console.log("⚠️ SendGrid not available, returning error for frontend fallback...");
    res.status(500).json({
      success: false,
      error: "SendGrid not configured",
      note: "Frontend should fall back to Firebase default email"
    });
  } catch (error: any) {
    console.error("❌ Error generating sign-in link:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send sign-in email",
      details: error.message,
    });
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

