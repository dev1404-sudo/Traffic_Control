import Razorpay from "razorpay";
import crypto from "crypto";
import Wallet from "../models/Wallet.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import User from "../models/User.js";

// Initialize Razorpay instance
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
   console.error("Error initializing Razorpay:", error);
}
// Get or create wallet for user
export const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      wallet = new Wallet({ user: userId });
      await wallet.save();
    }
    
    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
        isActive: wallet.isActive
      }
    });
  } catch (error) {
    console.error("Error getting wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get wallet information"
    });
  }
};

// Create Razorpay order for deposit
export const createDepositOrder = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const userId = req.user.id;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }
    
    // Get or create wallet
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      wallet = new Wallet({ user: userId });
      await wallet.save();
    }
    
      // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Payment service not configured. Please contact administrator."
      });
    }
    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `deposit_${userId}_${Date.now()}`,
      notes: {
        userId: userId,
        type: "wallet_deposit"
      }
    };
    
    const razorpayOrder = await razorpay.orders.create(orderOptions);
    
    // Create payment transaction record
    const transaction = new PaymentTransaction({
      user: userId,
      wallet: wallet._id,
      type: "deposit",
      amount: amount,
      paymentMethod: paymentMethod || "upi",
      razorpayOrderId: razorpayOrder.id,
      description: "Wallet deposit",
      status: "pending"
    });
    
    await transaction.save();
    
    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      transactionId: transaction._id
    });
    
  } catch (error) {
    console.error("Error creating deposit order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create deposit order"
    });
  }
};

// Verify payment and update wallet
export const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      transactionId 
    } = req.body;
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }
    
    // Find transaction
    const transaction = await PaymentTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }
    
    // Update transaction
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.status = "completed";
    await transaction.save();
    
    // Update wallet balance for deposit
    if (transaction.type === "deposit") {
      await Wallet.findByIdAndUpdate(
        transaction.wallet,
        { $inc: { balance: transaction.amount } }
      );
    }
    
    res.json({
      success: true,
      message: "Payment verified successfully",
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
        type: transaction.type
      }
    });
    
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed"
    });
  }
};

// Create withdraw request
export const createWithdrawRequest = async (req, res) => {
  try {
    const { amount, bankAccount } = req.body;
    const userId = req.user.id;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }
    
    // Get wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found"
      });
    }
    
    // Check sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }
    
    // Create withdraw transaction
    const transaction = new PaymentTransaction({
      user: userId,
      wallet: wallet._id,
      type: "withdraw",
      amount: amount,
      paymentMethod: "bank_transfer",
      description: "Wallet withdrawal",
      reference: bankAccount,
      status: "processing"
    });
    
    await transaction.save();
    
    // Deduct amount from wallet (hold in processing)
    await Wallet.findByIdAndUpdate(
      wallet._id,
      { $inc: { balance: -amount } }
    );
    
    res.json({
      success: true,
      message: "Withdrawal request created successfully",
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status
      }
    });
    
  } catch (error) {
    console.error("Error creating withdraw request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create withdrawal request"
    });
  }
};

// Get transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, type } = req.query;
    
    const query = { user: userId };
    if (type) {
      query.type = type;
    }
    
    const transactions = await PaymentTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-razorpaySignature -__v");
    
    const totalTransactions = await PaymentTransaction.countDocuments(query);
    
    res.json({
      success: true,
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTransactions / limit),
        totalTransactions
      }
    });
    
  } catch (error) {
    console.error("Error getting transaction history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction history"
    });
  }
};

// Payment webhook handler
export const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const webhookSignature = req.headers["x-razorpay-signature"];
    
    // Verify webhook signature
    if (webhookSecret) {
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");
      
      if (expectedSignature !== webhookSignature) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
    }
    
    const event = req.body;
    
    // Handle different webhook events
    switch (event.event) {
      case "payment.captured":
        // Payment successful
        console.log("Payment captured:", event.payload.payment.entity.id);
        break;
      case "payment.failed":
        // Payment failed
        console.log("Payment failed:", event.payload.payment.entity.id);
        break;
      default:
        console.log("Unhandled webhook event:", event.event);
    }
    
    res.json({ status: "ok" });
    
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};