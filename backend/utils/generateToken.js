 import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


export const generateToken =  (res, userId) => {
    const token = jwt.sign({_id: userId},process.env.JWT_SECRET,{
        expiresIn:"1d",
    });

    res.cookie("trafficjwt",token,{
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000,
    });
};