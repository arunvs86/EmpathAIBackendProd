import { sequelize } from "../../../config/postgres.js";
import Therapist from "../../../models/Therapist.js";
import UserAuthService from "./userAuthService.js";

class TherapistAuthService extends UserAuthService {
    async register(userData, roleData) {
        return sequelize.transaction(async (t) => {
            const user = await super.register(userData, { transaction: t });

            let normalizedLink = null;
            if (roleData.link && String(roleData.link).trim()) {
                const trimmed = String(roleData.link).trim();
                normalizedLink = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
            }

            await Therapist.create({
                user_id: user.id,
                specialization_tags: roleData.specialization_tags,
                link: normalizedLink,
                experience_years: roleData.experience_years,
                license_number: roleData.license_number,
                languages_spoken: roleData.languages_spoken || [],
                session_duration: roleData.session_duration || 60,
                appointment_types: roleData.appointment_types || ["text", "voice"],
                availability_preference: roleData.availability_preference || "weekly_schedule",
                verified: false,
            }, { transaction: t });

            return user;
        });
    }
}

export default TherapistAuthService;
