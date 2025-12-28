const mongoose = require("mongoose");

const PurposeSchema = new mongoose.Schema(
  {
    purposeName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      required: true,
    },

    sector: {
      type: String,
      trim: true,
      required: true,
    },

    isSensitive: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

const PurposeModel = mongoose.model("Purpose", PurposeSchema);

module.exports = PurposeModel;
