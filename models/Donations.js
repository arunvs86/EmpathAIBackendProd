import { DataTypes } from "sequelize";
import { sequelize } from "../config/postgres.js";

const Donations = sequelize.define("Donations", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    donor_id: {
        type: DataTypes.UUID,
        allowNull: false,
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
    initiative_name: {
        type: DataTypes.STRING(255), 
        allowNull: true,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    payment_method: {
        type: DataTypes.ENUM("stripe", "paypal"),
        allowNull: false,
    },
    transaction_status: {
        type: DataTypes.ENUM("pending", "completed", "failed"),
        defaultValue: "pending",
    },
    transaction_id: {
        type: DataTypes.STRING(255), 
        allowNull: false,
        unique: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: false,
});

export default Donations;
