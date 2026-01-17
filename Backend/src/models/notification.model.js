const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userConsentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserConsent",
      required: true,
    },
    dataPrincipalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fiduciaryEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DataEntity",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "WITHDRAW_REQUEST",
        "RENEW_REQUEST",
        "WITHDRAW_ACTION",
        "RENEW_ACTION",
        "WITHDRAW_REJECTED",
        "RENEW_REJECTED",
      ],
      required: true,
    },
    fromRole: {
      type: String,
      enum: ["DATA_PRINCIPAL", "DATA_FIDUCIARY"],
      required: true,
    },
    toRole: {
      type: String,
      enum: ["DATA_PRINCIPAL", "DATA_FIDUCIARY"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ fiduciaryEntityId: 1, toRole: 1, status: 1 });
notificationSchema.index({ dataPrincipalId: 1, toRole: 1, status: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
