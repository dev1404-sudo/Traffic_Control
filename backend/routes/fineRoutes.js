// routes/violationRoutes.js
 import express from "express";
 import { issueFine, listFines, updateFine } from "../controllers/fineController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Get violation type stats
router.get("/stats", async (req, res) => {
  try {
    const stats = await Violation.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json(stats.map(s => ({ type: s._id, count: s.count })));
  } catch (err) {
    console.error("❌ Error fetching violation stats:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});


/* ADMIN ROUTES */
router.post("/issue", protect, isAdmin, issueFine); 
router.get("/list", protect, isAdmin, listFines); 
router.put("/:fineId", protect, isAdmin, updateFine);

/* USER ROUTES */
router.get("/my-fines", protect); 
router.post("/pay/:fineId", protect); //todo: payment gateway required



export default router;
