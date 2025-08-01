import { DataTypes } from "sequelize";
import { sequelize } from "../config/postgres.js";

const TherapySession = sequelize.define("TherapySession", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    appointment_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "Appointments",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true, 
        references: {
            model: "Users",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    therapist_id: {
        type: DataTypes.UUID,
        allowNull: true, 
        references: {
            model: "Therapists",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    note_type: {
        type: DataTypes.ENUM("user_note", "therapist_note", "common_note", "session_feedback"),
        allowNull: false,
    },
    session_notes: {
        type: DataTypes.TEXT, 
        allowNull: true,
    },
    common_notes: {
        type: DataTypes.TEXT, 
        allowNull: true,
    },
    session_rating: {
        type: DataTypes.INTEGER, 
        allowNull: true,
    },
    user_rating: {
        type: DataTypes.INTEGER, 
        allowNull: true,
    },
    therapist_rating: {
        type: DataTypes.INTEGER, 
        allowNull: true,
    },
    user_feedback: {
        type: DataTypes.TEXT, 
        allowNull: true,
    },
    therapist_feedback: {
        type: DataTypes.TEXT, 
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    deleted_at: {
        type: DataTypes.DATE, 
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default TherapySession;
