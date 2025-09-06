import Vehicle from "../models/Vehicle.js";

// @desc   Add new vehicle
// @route  POST /api/vehicles
export const addVehicle = async (req, res) => {
  try {
    const { vehicleId, ownerName, type } = req.body;
    const exists = await Vehicle.findOne({ vehicleId });

    if (exists) return res.status(400).json({ message: "Vehicle already exists" });

    const vehicle = await Vehicle.create({ vehicleId, ownerName, type });
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all vehicles
// @route  GET /api/vehicles
export const getMyVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate("assignedDriver", "name");
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get single vehicle
// @route  GET /api/vehicles/:id
export const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("assignedDriver", "name");
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update vehicle
// @route  PUT /api/vehicles/:id
export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Delete vehicle
// @route  DELETE /api/vehicles/:id
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ message: "Vehicle removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
