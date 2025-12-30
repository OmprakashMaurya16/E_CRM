const mongoose = require("mongoose");

const userConsentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    consentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consent",
      required: true,
    },

    consentMetaDataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsentMetaData",
      required: true,
    },

    purposeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purpose",
      required: true,
    },

    status: {
      type: String,
      enum: ["GRANTED", "WITHDRAWN", "EXPIRED"],
      required: true,
    },

    givenAt: {
      type: Date,
      required: true,
    },

    withdrawnAt: {
      type: Date,
      default: null,
    },

    expiryAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const UserConsent = mongoose.model("UserConsent", userConsentSchema);

module.exports = UserConsent;
