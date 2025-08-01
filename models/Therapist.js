import { DataTypes } from "sequelize";
import { sequelize } from "../config/postgres.js";
import User from "./User.js";

const Therapist = sequelize.define(
  "Therapist",
  {
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
    specialization_tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    license_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    languages_spoken: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    session_duration: {
      type: DataTypes.INTEGER,
      defaultValue: 60,
    },
    appointment_types: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ["text", "voice"],
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    availability_preference: {
      type: DataTypes.ENUM("weekly_schedule", "custom_dates"),
      defaultValue: "weekly_schedule",
    },
    ratings: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: { min: 0, max: 5 },
    },
    google_tokens: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    paranoid: true,
  }
);

User.hasOne(Therapist, { foreignKey: "user_id", onDelete: "CASCADE" });
Therapist.belongsTo(User, { foreignKey: "user_id" });

export default Therapist;

