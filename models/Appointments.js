import { DataTypes } from "sequelize";
import { sequelize } from "../config/postgres.js";

const Appointments = sequelize.define("Appointments", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "Users", key: "id" },
    onDelete: "CASCADE",
  },
  therapist_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: "Therapists", key: "id" },
    onDelete: "CASCADE",
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  session_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 60,
  },
  session_type: {
    type: DataTypes.ENUM("text", "voice", "video"),
    allowNull: false,
    defaultValue: "text",
  },
  status: {
    type: DataTypes.ENUM(
      "pending",
      "confirmed",         // ← new
      "rejected",          // ← new
      "completed",
      "cancelled",
      "no_show"
    ),
    defaultValue: "pending",
  },
  // questionnaire fields:
  primary_concern: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  attended_before: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  session_goals: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
  },
  additional_details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  meet_url: {
    type: DataTypes.STRING(500),
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
  indexes: [
    {
      name: "therapist_slot_status_idx",
      fields: ["therapist_id", "scheduled_at", "status"],
    },
  ],
});

export default Appointments;
