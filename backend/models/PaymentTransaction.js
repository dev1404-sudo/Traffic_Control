import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    wallet: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Wallet", 
      required: true 
    },
    type: { 
      type: String, 
      enum: ["deposit", "withdraw", "payment"], 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    currency: { 
      type: String, 
      default: "INR" 
    },
    status: { 
      type: String, 
      enum: ["pending", "processing", "completed", "failed", "cancelled"], 
      default: "pending" 
    },
    paymentMethod: { 
      type: String, 
      enum: ["upi", "netbanking", "card", "wallet", "bank_transfer"], 
      required: true 
    },
    // Razorpay specific fields
    razorpayOrderId: { 
      type: String 
    },
    razorpayPaymentId: { 
      type: String 
    },
    razorpaySignature: { 
      type: String 
    },
    // Transaction metadata
    description: { 
      type: String, 
      trim: true 
    },
    reference: { 
      type: String 
    },
    // Failure reason for failed transactions
    failureReason: { 
      type: String 
    }
  },
  {
    timestamps: true,
    id: false,
  }
);

// Indexes for efficient lookups
paymentTransactionSchema.index({ user: 1, createdAt: -1 });
paymentTransactionSchema.index({ wallet: 1, status: 1 });
paymentTransactionSchema.index({ razorpayOrderId: 1 });

const PaymentTransaction = mongoose.model("PaymentTransaction", paymentTransactionSchema);
export default PaymentTransaction ;