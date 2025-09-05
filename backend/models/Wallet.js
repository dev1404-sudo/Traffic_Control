import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      unique: true 
    },
    balance: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    currency: { 
      type: String, 
      default: "INR" 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  {
    timestamps: true,
    id: false,
  }
);

// Index for efficient user wallet lookups
walletSchema.index({ user: 1 });

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;