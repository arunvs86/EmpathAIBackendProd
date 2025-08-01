import Admins from "../../../models/Admin.js";
import UserAuthService from "./userAuthService.js";

class AdminAuthService extends UserAuthService {
    async register(userData, roleData) {
        const user = await super.register(userData);

        await Admins.create({
            user_id: user.id,
            permissions: roleData.permissions || ["ban_users", "remove_posts", "approve_therapists"],
            last_active: roleData.last_active || new Date(),
        });

        return user;
    }
}

export default AdminAuthService;
