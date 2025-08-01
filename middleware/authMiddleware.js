import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js"; // PostgreSQL User Model

dotenv.config();

const authMiddleware = async (req, res, next) => {
    try {
        
        const token = req.header("Authorization");
        if (!token) {
            return res.status(401).json({ error: "Access Denied. No token provided." });
        }

        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({ error: "Invalid token. User not found." });
        }

        req.user = {
            id: user.id,
            role: user.role,
            email: user.email,
        };

        next(); // Proceed to the next middleware/controller
    } catch (error) {
        res.status(403).json({ error: "Invalid or expired token." });
    }
};

export default authMiddleware;
