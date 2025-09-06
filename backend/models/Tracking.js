 import mongoose from "mongoose";

const trackingSchema = new mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true
    },

    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number], 
            required: true
        }
    },

    speed : {
        type: Number,
        default: 0 
    },

    congestionLevel : {
        type: Number,
        deafult: 0
    },

    timestamp: {
        type: Date,
        default: Date.now
    }
});

trackingSchema.index({ location: "2dsphere" });

trackingSchema.virtual("lat").get(function () {
  return this.location.coordinates[1];
});

trackingSchema.virtual("lng").get(function () {
  return this.location.coordinates[0];
});
const Tracking = mongoose.model("Tracking",trackingSchema);
export default Tracking;