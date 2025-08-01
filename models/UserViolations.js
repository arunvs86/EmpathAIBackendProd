import { DataTypes } from "sequelize";
import { sequelize } from "../config/postgres.js";

const UserViolations = sequelize.define("UserViolations", {
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
    reported_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "Users", 
            key: "id",
        },
        onDelete: "CASCADE",
    },
    target_post_id: {
        type: DataTypes.STRING,
        allowNull: true,
        onDelete: "CASCADE",
    },
    
    violation_reason: {
        type: DataTypes.ENUM("abuse", "spam", "misinformation", "harmful content", "other"),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT, 
        allowNull: true,
    },
    severity: {
        type: DataTypes.ENUM("minor", "major"),
        defaultValue: "minor",
    },
    resolved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, 
    },
    reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true, 
        references: {
            model: "Users",
            key: "id",
        },
        onDelete: "SET NULL",
    },
    resolution_notes: {
        type: DataTypes.TEXT, 
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

export default UserViolations;
