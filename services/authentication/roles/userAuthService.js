import User from "../../../models/User.js";
import passwordHasher from "../../../utils/passwordHasher.js";

class UserAuthService {
    async register(userData) {
        const existingUser = await User.findOne({ where: { email: userData.email } });
        if (existingUser) throw new Error("Email already in use.");

        userData.password_hash = await passwordHasher.hashPassword(userData.password);

        const user = await User.create({
            username: userData.username,
            email: userData.email,
            password_hash: userData.password_hash,
            role: userData.role,         // ensure role is validated elsewhere
            dob: userData.dob,           // only if you need it
            gender: userData.gender,
            bio: userData.bio,
            profile_picture: userData.profile_picture,
            country: userData.country,
            city: userData.city,
            religious_support: userData.religious_support,
            about: userData.about,
            faith_support: userData.faith_support,
            current_feelings: userData.current_feelings,
          });
          
        return user;
    }
}

export default UserAuthService;

