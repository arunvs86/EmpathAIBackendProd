import { DataTypes } from "sequelize";
import { sequelize } from "../config/postgres.js";
import User from "./User.js";

const Admins = sequelize.define("Admins", {
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
    permissions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: ["ban_users", "remove_posts","approve_therapists"],
    },
    last_active: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

User.hasOne(Admins, {foreignKey:"user_id",onDelete:"CASCADE"})
Admins.belongsTo(User, {foreignKey:"user_id"})

export default Admins;
