const mongoose = require("mongoose");

const dataEntitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    entityType: {
      type: String,
      enum: ["DATA_FIDUCIARY", "DATA_PROCESSOR"],
      required: true,
    },

    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    logoUrl: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

const dataEntityModel = mongoose.model("DataEntity", dataEntitySchema);

module.exports = dataEntityModel;
