const mongoose = require("mongoose");

const ConsentMetaDataSchema = new mongoose.Schema(
  {
    consentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consent",
      required: true,
    },

    version: {
      type: String,
      required: true,
    },

    methodOfCollection: {
      type: String,
      enum: ["ONLINE", "OFFLINE", "MOBILE_APP", "IN_PERSON"],
      required: true,
    },
  },
  { timestamps: true }
);

const ConsentMetaData = mongoose.model(
  "ConsentMetaData",
  ConsentMetaDataSchema
);

module.exports = ConsentMetaData;
