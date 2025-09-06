import mongoose from "mongoose";

const tollSchema = new mongoose.Schema({
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },

    vehicleTypeCharges: {
        car: { type: Number, default: 50 },
        bike: { type: Number, default: 20 },
        bus: { type: Number, default: 100 },
        truck: { type: Number, default: 150 }
    },

    congestionLevel: {
        type: Number, 
        default: 0
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

tollSchema.index({location: "2dsphere"});
const Toll = mongoose.model("Toll",tollSchema);
export default Toll;