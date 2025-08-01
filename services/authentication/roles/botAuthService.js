import Bot from "../../../models/Bot.js";
import UserAuthService from "./userAuthService.js";

class BotAuthService extends UserAuthService {
    async register(userData, roleData) {
        const user = await super.register(userData);

        await Bot.create({
            user_id: user.id,
            bot_type: roleData.bot_type || "chatbot",
            status: roleData.status || "active",
        });

        return user;
    }
}

export default BotAuthService;
