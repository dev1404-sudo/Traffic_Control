import express from "express";
import {
  getWallet,
  createDepositOrder,
  verifyPayment,
  createWithdrawRequest,
  getTransactionHistory,
  handleWebhook
} from "../controllers/walletController.js";
import {protect} from "../middleware/authMiddleware.js";

const router = express.Router();

// Get wallet information
router.get("/", protect, getWallet);

// Create deposit order
router.post("/deposit", protect, createDepositOrder);

// Verify payment
router.post("/verify-payment",protect, verifyPayment);

// Create withdraw request
router.post("/withdraw",protect, createWithdrawRequest);

// Get transaction history
router.get("/transactions", protect, getTransactionHistory);

// Webhook endpoint (no auth middleware needed)
router.post("/webhook", handleWebhook);

export default router;