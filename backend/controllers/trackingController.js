import * as trackingService from "../services/tracking.service.js";
import * as congestionService from "../services/congestion.service.js";
import * as notificationService from "../services/notification.service.js";
import  Vehicle  from "../models/Vehicle.js";

export const createTracking = async (req, res) => {
    try {
        const { lat, lng, speed } = req.body;
        const userId = req.user._id;
        const vehicle = await Vehicle.findOne({ ownerId: userId });
        if(!vehicle) return res.status(404).json({ message: "No vehicle found for this user" });


        const tracking = await trackingService.saveTracking(vehicle._id, lat, lng, speed);

        await congestionService.updateCongestionFromTracking(tracking);
        await notificationService.checkAndSendAlerts(userId, vehicle._id, tracking);

        res.status(201).json({info: tracking});
    } catch (error) {
         res.status(500).json({ message: "Error creating tracking", error: error.message });
    }
};

export const getAllTracking = async (req, res) => {
    try {
        const tracking = await trackingService.getLatestTracking(req.params.vehicleId);
        res.json(tracking);
    } catch (error) {
         res.status(500).json({ message: "Error fetching vehicle tracking", error: error.message });
    }
}


export const getNearbyVehicles = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        const vehicles = await trackingService.findNearByVehicles(lat, lng, radius);
        res.json(vehicles); 
    } catch (error) {
         res.status(500).json({ message: "Error fetching nearby vehicles", error: error.message });
    } 
};

export const updateTollCongestion = async (req, res) => {
  try {
    const toll = await congestionService.updateTollCongestion(req.params.tollId, req.body.level);
    res.json(toll);
  } catch (error) {
    res.status(500).json({ message: "Error updating congestion", error: err.message });
  }
};


export const getCongestedTolls = async (req, res) => {
  try {
    const tolls = await congestionService.getCongestedTolls();
    res.json(tolls);
  } catch (erroe) {
    res.status(500).json({ message: "Error fetching congested tolls", error: error.message });
  }
}; 