import authService from "../services/authentication/authService.js";
import emailService from "../services/email/emailService.js";

class AuthController {
    
    async register(req, res) {
        try {
            const { userData, roleData } = req.body;
            const result = await authService.register(userData, roleData);            
            await emailService.sendVerificationEmail(result);

            res.status(201).json({
                message: "Registration successful. Please verify your email.",
                ...result,
            });

        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async verifyEmail(req, res) {
        try {
            const { token } = req.query;
            const decoded = await emailService.verifyEmail(token);
            await authService.updateVerifiedStatus(decoded);
            res.status(200).json({ message: "Email verified successfully!" });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshToken(refreshToken);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.logout(refreshToken);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async revokeAllSessions(req, res) {
        try {
            const { userId } = req.body;
            const result = await authService.revokeAllSessions(userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const result = await authService.forgotPassword(email);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            const result = await authService.resetPassword(token, newPassword);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

export default new AuthController();
