import  User  from "../models/User.js"

export const isAdmin = async(req,next) => {
    const user = await User.findById(req.user._id);
    if(user.role === "admin") next();
}