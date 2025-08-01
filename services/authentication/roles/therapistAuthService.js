import Therapist from "../../../models/Therapist.js";
import UserAuthService from "./userAuthService.js";

class TherapistAuthService extends UserAuthService {
    async register(userData, roleData) {
        const user = await super.register(userData);

        const therapist = await Therapist.create({
            user_id: user.id,
            // specialization_tags: roleData.specialization_tags,
            experience_years: roleData.experience_years, 
            license_number: roleData.license_number,
            languages_spoken: roleData.languages_spoken || [], 
            session_duration: roleData.session_duration || 60, 
            appointment_types: roleData.appointment_types || ["text", "voice"], 
            availability_preference: roleData.availability_preference || "weekly_schedule",
            verified: false, 
        });

        return user;
    }
}

export default TherapistAuthService;
