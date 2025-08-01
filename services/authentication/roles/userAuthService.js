import User from "../../../models/User.js";
import passwordHasher from "../../../utils/passwordHasher.js";

class UserAuthService {
    async register(userData) {
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) throw new Error("Email already in use.");

        userData.password_hash = await passwordHasher.hashPassword(userData.password);

        const user = await User.create(userData);
        return user;
    }
}

export default UserAuthService;

