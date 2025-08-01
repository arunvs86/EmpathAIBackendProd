import { DataTypes } from "sequelize";
import { sequelize } from "../config/postgres.js";
import User from "./User.js"; 

const Bot = sequelize.define("Bot", {
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
    bot_type: {
        type: DataTypes.ENUM("chatbot", "moderation_bot", "recommendation_ai"),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active",
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

User.hasOne(Bot, { foreignKey: "user_id", onDelete: "CASCADE" });
Bot.belongsTo(User, { foreignKey: "user_id" });

export default Bot;
