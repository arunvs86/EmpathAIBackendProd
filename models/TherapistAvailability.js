import { DataTypes } from "sequelize";
import { sequelize } from "../config/postgres.js";

const TherapistAvailability = sequelize.define("TherapistAvailability", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    therapist_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "Therapists",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    availability_type: {
        type: DataTypes.ENUM("manual", "ai_generated"),
        defaultValue: "manual",
    },
    selected_dates: {
        type: DataTypes.ARRAY(DataTypes.DATEONLY), 
        allowNull: true,
    },
    selected_time_slots: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    ai_input_text: {
        type: DataTypes.TEXT, 
        allowNull: true,
    },
    ai_processed_slots: {
        type: DataTypes.JSONB, 
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM("available", "booked","requested"),
        defaultValue: "available",
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull:true
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default TherapistAvailability;
