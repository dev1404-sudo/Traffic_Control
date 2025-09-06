 import mongoose from "mongoose";

const fineSchema = new mongoose.Schema({
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true
    },

    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    reason: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
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

    status: {
        type: String,
        enum: ["unpaid", "paid"],
        default: "unpaid"
    },

    issuedAt: {
        type: Date,
        default: Date.now
    },

    paidAt: {
        type: Date
    }
});

fineSchema.index({location: "2dsphere"});

const Fine = mongoose.model("Fine",fineSchema);

export default Fine;