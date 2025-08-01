import bcrypt from "bcryptjs";

class PasswordHasher {
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
}

export default new PasswordHasher();
