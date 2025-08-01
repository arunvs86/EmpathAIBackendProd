import jwt from "jsonwebtoken"; 
import userAuthService from "./roles/userAuthService.js";
import therapistAuthService from "./roles/therapistAuthService.js";
import adminAuthService from "./roles/adminAuthService.js";
import botAuthService from "./roles/botAuthService.js";
import User from "../../models/User.js";
import TokenService from "./tokenService.js";
import passwordHasher from "../../utils/passwordHasher.js";
import RefreshToken from "../../models/RefreshToken.js";
import emailService from "../email/emailService.js";

class AuthService {
    constructor() {
        this.roleHandlers = {
            user: new userAuthService(),
            therapist: new therapistAuthService(),
            admin: new adminAuthService(),
            bot: new botAuthService()
        };
    }

    async register(userData, roleData = {}) {
        const roleService = this.roleHandlers[userData.role];
        const user = await roleService.register(userData, roleData);

        return user;
    }

    async updateVerifiedStatus(decoded){
        await User.update({ email_verified: true }, { where: { id: decoded.id } });
    }

    async login(email, password) {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new Error("User not found.");

        const isMatch = await passwordHasher.comparePassword(password, user.password_hash);
        if (!isMatch) throw new Error("Invalid password.");

        if (!user.email_verified) throw new Error("Email not verified. Please verify your email before logging in.");
        if (user.account_status === "banned") throw new Error("Your account has been banned.");
        if (user.account_status === "deactivated") throw new Error("Your account has been deactivated.");

        const tokenObject = new TokenService();
        const accessToken = tokenObject.geneateAccessToken(user);
        const refreshToken = tokenObject.generateRefreshToken(user);

        await RefreshToken.create({
            user_id: user.id,
            token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
        });

        return { user, accessToken, refreshToken };
    }

    async refreshToken(refreshToken) {
        const storedToken = await RefreshToken.findOne({ where: { token: refreshToken } });
        if (!storedToken) throw new Error("Invalid refresh token. Please log in again.");

        const decoded = tokenService.verifyToken(refreshToken, process.env.REFRESH_SECRET);
        const user = await User.findByPk(decoded.id);
        if (!user) throw new Error("Invalid refresh token.");

        const newAccessToken = tokenService.generateAccessToken(user);
        return { accessToken: newAccessToken };
    }

    async logout(refreshToken) {
        const deletedToken = await RefreshToken.destroy({ where: { token: refreshToken } });
        if (!deletedToken) throw new Error("Invalid refresh token or already logged out.");
        return { message: "Logged out successfully. Token invalidated." };
    }

    async revokeAllSessions(userId) {
        await RefreshToken.destroy({ where: { user_id: userId } });
        return { message: "All sessions revoked successfully." };
    }

    async forgotPassword(email) {
        const user = await User.findOne({ where: { email } });
        if (!user) throw new Error("No account found with this email.");

        await emailService.sendPasswordResetEmail(user);
        return { message: "Password reset link sent to your email." };
    }

    async resetPassword(token, newPassword) {
        const decoded = await this.verifyResetToken(token);

        const hashedPassword = await passwordHasher.hashPassword(newPassword);
        await User.update({ password:newPassword,password_hash: hashedPassword }, { where: { id: decoded.id } });

        return { message: "Password reset successful. You can now log in with your new password." };
    }

    verifyResetToken(token) {
        try {
            return jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
          } catch (error) {
            console.error("Reset token verification failed:", {
              message: error.message,
              secret: process.env.RESET_PASSWORD_SECRET,
              tokenSnippet: token?.slice(0,10) + "...",
            });
            throw new Error("Invalid or expired password reset token.");
          }
    }

}

export default new AuthService();
