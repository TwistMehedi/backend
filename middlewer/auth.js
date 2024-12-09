import jwt from "jsonwebtoken";
import { User } from "../modals/userModel.js";


export const isAuthenticated =async(req, res, next) =>{
    try {
        const token = req.cookies.token;
        if(!token){
            return res.status(404).json({
                message: "Token not found",
                duccess: false
            });
        };

        const decodedToken = jwt.verify(token, process.env.SECREK_KEY);
        if(!decodedToken){
            return res.status(404).json({
                message: "Token decoded problem",
                success:false
            });
        };

        const user = await User.findById(decodedToken.token).populate("followers").populate("threads").populate("replies").populate("repost");
        if(!user){
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        };
        req.user = user;
        next();
    } catch (error) {
        return res.status(400).json({
            message: error.message,
            success: false
        });
    };
};