import { DataTypes } from "sequelize";
import { sequelize } from "../config/postgres.js";

const AdminActions = sequelize.define("AdminActions", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    admin_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "Users", 
            key: "id",
        },
        onDelete: "CASCADE",
    },
    action_type: {
        type: DataTypes.ENUM("ban_user", "unban_user", "remove_post", "warn_user", "resolve_violation"),
        allowNull: false,
    },
    target_user_id: {
        type: DataTypes.UUID,
        allowNull: true, 
        references: {
            model: "Users",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    target_post_id: {
        type: DataTypes.UUID,
        allowNull: true, 
    },
    violation_id: {
        type: DataTypes.UUID,
        allowNull: true, 
        references: {
            model: "UserViolations",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    reason: {
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
}, {
    timestamps: false,
});

export default AdminActions;
