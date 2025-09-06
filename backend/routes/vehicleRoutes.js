 import express from "express";
import Vehicle from "../models/Vehicle.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import { addVehicle, getMyVehicles, getVehicle, deleteVehicle, updateVehicle } from "../controllers/vehicleController.js";
const router = express.Router();

 

// Get all vehicles
router.get("/", async (req, res) => {
  const vehicles = await Vehicle.find();
  res.json(vehicles);
});

// Add vehicle
router.post("/", async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update vehicle
router.put("/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(vehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete vehicle
router.delete("/:id", async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: "Vehicle deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* USER ROUTES */
router.post("/register", protect, addVehicle);
router.get("/get-my-vehicles", protect, getMyVehicles);

/* ADMIN ROUTES */
router.get("/get-vehicles", protect, isAdmin, getVehicle);
router.delete("/delete-vehicle/:id", protect, isAdmin, deleteVehicle);
router.put("/update-vehicle/:id", protect, isAdmin, updateVehicle);


export default router;
