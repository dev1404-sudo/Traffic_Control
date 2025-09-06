// notification.service.js
import  Fine  from "../models/Fine.js";
import  Toll  from "../models/Toll.js";
import   PaymentTransaction  from "../models/PaymentTransaction.js";
import  User  from "../models/User.js";

// Utility to send socket notifications
export const sendSocketNotification = (io, userId, payload) => {
  io.to(userId.toString()).emit("notification", payload);
};

// Main alert checker
export const checkAndSendAlerts = async (userId, vehicleId, tracking) => {
  const io = global.io;
  const user = await User.findById(userId);
  if (!user) return;

  // ================== 1. Handle Toll Charges (Auto-Deduct) ================== //
  const toll = await Toll.findOne({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: tracking.location.coordinates },
        $maxDistance: 200, // 200m proximity
      },
    },
  });

  if (toll) {
    const charge = toll.vehicleTypeCharges.car; // ⚠️ TODO: map by actual vehicle.type
    let status = "failed";

    if (user.walletBalance >= charge) {
      user.walletBalance -= charge;
      await user.save();
      status = "success";
    }

    await Transaction.create({
      userId,
      vehicleId,
      type: "toll",
      amount: charge,
      status,
      referenceId: toll._id,
      typeRef: "Toll",
      location: tracking.location,
    });

    sendSocketNotification(io, userId, {
      type: "toll",
      status,
      message:
        status === "success"
          ? `Toll auto-deducted: ₹${charge}`
          : `Toll detected but insufficient balance (₹${charge})`,
      tollId: toll._id,
      congestionLevel: toll.congestionLevel,
    });
  }

  // ================== 2. Handle Fines (Notify Only) ================== //
  const fines = await Fine.find({ vehicleId, status: "unpaid" });

  for (const fine of fines) {
    sendSocketNotification(io, userId, {
      type: "fine",
      status: "unpaid",
      message: `You have an unpaid fine of ₹${fine.amount} (${fine.reason})`,
      fineId: fine._id,
      issuedAt: fine.issuedAt,
    });
  }
};