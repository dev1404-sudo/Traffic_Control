import  Tracking  from "../models/Tracking.js";
export const saveTracking = async (vehicleId, lat, lng, speed) => {
  const tracking = new Tracking({
    vehicle: vehicleId,
    location: { type: "Point", coordinates: [lng, lat] },
    speed,
  });
  return await tracking.save();
};

export const getLatestTracking = async (vehicleId) => {
  return await Tracking.findOne({ vehicle: vehicleId })
    .sort({ timestamp: -1 })
    .lean();
};

export const getAllTracking = async () => {
  return await Tracking.find({})
    .populate("vehicle", "plateNumber status")
    .sort({ timestamp: -1 });
};

export const findNearbyVehicles = async (lat, lng, radius = 1000) => {
  return await Tracking.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
        distanceField: "dist.calculated",
        maxDistance: parseFloat(radius),
        spherical: true,
      },
    },
    { $limit: 50 },
  ]);
};