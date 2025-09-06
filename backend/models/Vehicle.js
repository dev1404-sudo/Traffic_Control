 import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },

    plateNumber: {
        type: Number,
        required: true,
        unique: true,
        trim: true,
    },

    type: {
        type: String,
        required: true
    },

    obuId: {
        type: String,
        required: true,
        unique: true
    },

    status: {
        type: String,
        enum: ["active","blacklisted","suspended"],
        default: "active" 
    },
},{timestamps: true});

const Vehicle = mongoose.model("Vehicle",vehicleSchema);
export  default Vehicle ;