// import { DataTypes } from "sequelize";
// import { sequelize } from "../config/postgres.js";

// const Appointments = sequelize.define("Appointments", {
//   id: {
//     type: DataTypes.UUID,
//     defaultValue: DataTypes.UUIDV4,
//     primaryKey: true,
//   },
//   user_id: {
//     type: DataTypes.UUID,
//     allowNull: false,
//     references: { model: "Users", key: "id" },
//     onDelete: "CASCADE",
//   },
//   therapist_id: {
//     type: DataTypes.UUID,
//     allowNull: false,
//     references: { model: "Therapists", key: "id" },
//     onDelete: "CASCADE",
//   },
//   scheduled_at: {
//     type: DataTypes.DATE,
//     allowNull: false,
//   },
//   session_duration: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     defaultValue: 60,
//   },
//   session_type: {
//     type: DataTypes.ENUM("text", "voice", "video"),
//     allowNull: false,
//     defaultValue: "text",
//   },
//   status: {
//     type: DataTypes.ENUM(
//       "pending",
//       "confirmed",
//       "rejected",
//       "completed",
//       "cancelled",
//       "no_show",
//       "reschedule_pending" // ← added
//     ),
//     defaultValue: "pending",
//   },
//   // questionnaire fields:
//   primary_concern: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   attended_before: {
//     type: DataTypes.BOOLEAN,
//     allowNull: false,
//     defaultValue: false,
//   },
//   session_goals: {
//     type: DataTypes.ARRAY(DataTypes.STRING),
//     allowNull: true,
//   },
//   additional_details: {
//     type: DataTypes.TEXT,
//     allowNull: true,
//   },
//   notes: {
//     type: DataTypes.TEXT,
//     allowNull: true,
//   },
//   meet_url: {
//     type: DataTypes.STRING(500),
//     allowNull: true,
//   },
//   proposed_slots: {           // NEW
//     type: DataTypes.JSONB,    // use JSON if not Postgres
//     allowNull: true,
//     defaultValue: [],
//   },
//   proposal_expires_at: {      // NEW
//     type: DataTypes.DATE,
//     allowNull: true,
//   },
//   cancellation_reason: {      // NEW (optional)
//     type: DataTypes.TEXT,
//     allowNull: true,
//   },
//   created_at: {
//     type: DataTypes.DATE,
//     defaultValue: DataTypes.NOW,
//   },
//   updated_at: {
//     type: DataTypes.DATE,
//     defaultValue: DataTypes.NOW,
//   },
//   deleted_at: {
//     type: DataTypes.DATE,
//     allowNull: true,
//   },
// }, {
//   timestamps: false,
//   indexes: [
//     {
//       name: "therapist_slot_status_idx",
//       fields: ["therapist_id", "scheduled_at", "status"],
//     },
//   ],
// });

// export default Appointments;

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
      "confirmed",
      "rejected",
      "completed",
      "cancelled",
      "no_show",
      "reschedule_pending"
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

  // legacy field you already had for meeting links
  meet_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },

  // 🔥 NEW: store long JWT join URLs without worrying about 500-char limit
  client_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pro_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // reschedule proposal fields
  proposed_slots: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  proposal_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  cancellation_reason: {
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
  indexes: [
    {
      name: "therapist_slot_status_idx",
      fields: ["therapist_id", "scheduled_at", "status"],
    },
  ],
});

export default Appointments;
