import  Toll  from "../models/Toll.js";

export const addToll = async (req, res) => {
    try {
        const { location } = req.body;
        if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
            return res.status(400).json({ success: false, message: "Location must be [lng, lat]" });
        }
        const toll = new Toll({
            location
        });
        await toll.save();
        res.status(201).json({ msg: "Toll added", data: toll });
    } catch (error) {
        console.error("Error in add toll controller", error.message);
        return res.status(500).json({ msg: "Internal server Error" });
    }
};

export const updateToll = async (req, res) => {
    try {
        const { tollId: id } = req.params;
        const filter = {};
        const { location, vehicleTypeCharges, congestionLevel } = req.body;

        if (location && location.coordinates && location.type === "Point") {
            filter.location = location;
        }
        if (congestionLevel && typeof congestionLevel === "number") {
            filter.congestionLevel = congestionLevel;
        }
        if (vehicleTypeCharges) {
            filter.vehicleTypeCharges = { ...vehicleTypeCharges };
        }
        filter.updatedAt = Date.now();

        const toll = await Toll.findByIdAndUpdate(id, filter, { new: true, runValidators: true })
        if (!toll) {
            return res.status(404).json({ message: "Toll not found." });
        }
        res.status(201).json({ msg: "Successfully Updated Toll", data: toll });
    } catch (error) {
        console.error("Error in updateToll:", error);
        res.status(500).json({ message: "Server error." });
    }
};


export const deleteToll = async (req, res) => {
    try {
        const { tollId: id } = req.params;
        const toll = await Toll.findByIdAndDelete(id);
        if (!toll) {
            return res.status(404).json({ message: "Toll not found." });
        }
        res.status(201).json({ msg: "Toll Deleted Successfully" });
    } catch (error) {
        console.error("Error in delete toll controller:", error);
        res.status(500).json({ message: "Server error." });
    }
};

export const getTollsAlongRoute = async (req, res) => {
  try {
    const { startLat, startLng, endLat, endLng, radius = 5, vehicleType } = req.query;

    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({ message: "Start and end coordinates required." });
    }

    const start = [parseFloat(startLng), parseFloat(startLat)];
    const end = [parseFloat(endLng), parseFloat(endLat)];
    const maxDistance = parseFloat(radius) * 1000; // in meters

    // Compute mid-point to use for $geoNear
    const midPoint = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2
    ];

    // Compute approximate distance between start and end
    const distanceBetween = getDistanceKm(start, end) * 1000; // meters

    // Query tolls near the line midpoint within radius + half distance
    let tolls = await Toll.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: midPoint },
          distanceField: "distanceFromQuery",
          maxDistance: maxDistance + distanceBetween / 2, // buffer to include all along the line
          spherical: true
        }
      },
      {
        $addFields: {
          distanceFromStart: {
            $let: {
              vars: {
                start: start
              },
              in: {
                $function: {
                  body: function(coord, startCoord) {
                    const R = 6371; // km
                    const [lon1, lat1] = startCoord;
                    const [lon2, lat2] = coord;
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
                    const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    return R * c;
                  },
                  args: ["$location.coordinates", "$$start"],
                  lang: "js"
                }
              }
            }
          }
        }
      },
      { $sort: { distanceFromStart: 1 } }
    ]);

    // Filter by vehicle type if provided
    if (vehicleType) {
      tolls = tolls.filter(toll => toll.vehicleTypeCharges.hasOwnProperty(vehicleType));
    }

    res.json(tolls);

  } catch (error) {
    console.error("Error in getTollsAlongRoute:", error);
    res.status(500).json({ message: "Internal Server error." });
  }
};


export const getSpecificTollDetails = async(req, res) => {
    try {
        const {tollId: id} = req.params;
        const toll = await Toll.findById(id).lean();
        if(!toll) {
            return res.status(404).json({ message: "Toll not found." });
        }
        res.status(201).json({data: toll});
    } catch (error) {
        console.error("Error in get Specific details toll controller:", error);
        res.status(500).json({ message: "Server error." });
    }
}

// Haversine formula for distance in km
function getDistanceKm(coord1, coord2) {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // Earth radius in km

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};