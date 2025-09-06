 import  User  from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if(!name || !email || !password) {
            return res.status(401).json({msg:"All fields are required"});
        }
        const user = await User.findOne({ email });
        if(user) return res.status(401).json({msg:"User Already Exists"});
        

        const hashedPassword = await bcrypt.hash(password,10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });
        generateToken(res, newUser._id);
        await newUser.save();
        res.status(200).json({
            msg:"Signup Successful",
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email
        });
    } catch (error) {
        console.log("Error in Signup Controller",error.message);
        return res.status(500).json({msg:"Internal Server Error"});
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if(!email || !password) return res.status(401).json({msg:"All fields are required"});
        const user =  await User.findOne({ email });
        if(!user) return res.status(404).json({msg:"Invalid Credentials"});
        const isMatchPassword = await bcrypt.compare(password,user.password);
        if(!isMatchPassword) return res.status(404).json({msg:"Invalid Credentials"});
        generateToken(res, user._id);
        res.status(200).json({
            msg:"Login Successful",
            _id: user._id,
            name: user.name,
            email: user.email
        });
    } catch (error) {
        console.log("Error in Login Controller",error.message);
        return res.status(500).json({msg:"Internal Server Error"});
    }
}


export const logout = async (req, res) => {
    res.cookie("trafficjwt",'',{
        httpOnly: true,
        expiresIn: new Date(0)
    });
    res.status(200).json({msg:"Logout Successfull"});
}

export const profile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch (error) {
         console.log("Error in Profile Controller",error.message);
        return res.status(500).json({msg:"Internal Server Error"});
    }
}