 import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import { createTracking, getAllTracking, getNearbyVehicles, updateTollCongestion, getCongestedTolls } from "../controllers/trackingController.js";
const router = express.Router();

router.use(protect);

// 📍 Driver updates location
router.post("/", createTracking);


router.get("/vehicle/:vehicleId", getNearbyVehicles);

router.get("/get-all-trackings", isAdmin, getAllTracking);

router.get("/nearby", isAdmin, getNearbyVehicles);


// =================== TOLL CONGESTION =================== //

router.patch("/toll/:tollId/congestion", isAdmin, updateTollCongestion);


router.get("/toll/congested", getCongestedTolls);

export default router;