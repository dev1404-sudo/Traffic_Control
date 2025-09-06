 import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import  User  from "../models/User.js";
dotenv.config();


export const protect = async (req, res, next) => {
    try {
        const token = req.cookies['trafficjwt'];
        if(!token) return res.status(404).json({msg:"Unauthorized"});
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded) return res.status(404).json({msg: "Unauthorized"});

        const decodedUser = await User.findById(decoded._id).select("-password");
        req.user = decodedUser;
        next();
    } catch (error) {
        console.log("Error in protect Middleware",error.message);
        return res.status(500).json({msg:"Internal Server Error"});
    }
}