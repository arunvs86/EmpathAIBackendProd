import { DataTypes } from "sequelize";
import { sequelize } from "../config/postgres.js";

const JournalEntries = sequelize.define("JournalEntries", {
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
    entry: {
        type: DataTypes.TEXT,
        allowNull: true, 
    },
    media_files: {
        type: DataTypes.ARRAY(DataTypes.STRING), 
        allowNull: true,
    },
    sentiment: {
        type: DataTypes.ENUM("positive", "neutral", "negative"),
        allowNull: true, 
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true
    },
    deleted_at: {
        type: DataTypes.DATE, 
        allowNull: true,
    },
}, {
    timestamps: false,
});

export default JournalEntries;
