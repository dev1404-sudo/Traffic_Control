 import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import { getVehicleTracking, getAllTracking, getNearbyVehicles, updateTollCongestion, getCongestedTolls } from "../controllers/tracking.controller.js";
const router = express.Router();

router.use(protect);

// 📍 Driver updates location
router.post("/", createTracking);


router.get("/vehicle/:vehicleId", getVehicleTracking);

router.get("/get-all-trackings", isAdmin, getAllTracking);

router.get("/nearby", isAdmin, getNearbyVehicles);


// =================== TOLL CONGESTION =================== //

router.patch("/toll/:tollId/congestion", isAdmin, updateTollCongestion);


router.get("/toll/congested", getCongestedTolls);

export { router as trackingRouter };