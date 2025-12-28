const mongoose = require("mongoose");

const ConsentSchema = new mongoose.Schema(
  {
    consentTitle: {
      type: String,
      required: true,
      trim: true,
    },

    consentType: {
      type: String,
      enum: ["EXPLICIT", "INFORMED", "SPECIFIC", "UNCONDITIONAL", "OPTIONAL"],
      required: true,
    },

    consentDescription: {
      type: String,
      required: true,
    },

    dataEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DataEntity",
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);
