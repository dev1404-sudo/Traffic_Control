import  Toll  from "../models/Toll.js";
import  Tracking  from "../models/Tracking.js";


export const updateTollCongestion = async (tollId, level) => {
  return await Toll.findByIdAndUpdate(
    tollId,
    { congestionLevel: level, updatedAt: Date.now() },
    { new: true }
  );
};

export const updateCongestionFromTracking = async (tracking) => {
  // TODO: call ML model here with vehicle density, avg speed, etc.
  // For now: simulate congestion level
  const congestion = tracking.speed < 20 ? 80 : 20;

  // Find nearest toll and update it
  await Toll.updateOne(
    {
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: tracking.location.coordinates },
          $maxDistance: 500, // 500m around toll
        },
      },
    },
    { $set: { congestionLevel: congestion, updatedAt: Date.now() } }
  );
};


export const getCongestedTolls = async () => {
  return await Toll.find({ congestionLevel: { $gte: 70 } });
};