import { DataTypes } from "sequelize";
import { sequelize } from "../config/postgres.js";

const UserActivity = sequelize.define("UserActivity", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "Users",
            key: "id",
        },
        onDelete: "CASCADE",
    },

    login_time: {
        type: DataTypes.DATE, 
        allowNull: true,
    },
    logout_time: {
        type: DataTypes.DATE, 
        allowNull: true,
    },
    last_logged_mood: {
        type: DataTypes.ENUM("happy", "sad", "neutral", "anxious", "stressed"),
        allowNull: true, 
    },
    last_updated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

export default UserActivity;
