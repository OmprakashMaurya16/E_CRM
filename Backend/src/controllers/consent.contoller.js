const UserConsent = require("../models/userConsent.model");
const ConsentMetaData = require("../models/consentMetaData.model");
const DataEntity = require("../models/dataEntity.model");
const Consent = require("../models/consent.model");
const Purpose = require("../models/purpose.model");

const listAllConsents = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userConsents = await UserConsent.find({ userId }).populate([
      { path: "consentId", populate: { path: "dataEntityId" } },
      { path: "purposeId" },
      {
        path: "consentMetaDataId",
        select: "methodOfCollection version",
      },
    ]);

    console.log(userConsents);

    res.status(200).json({ success: true, data: userConsents });
  } catch (error) {
    console.error("Error fetching user consents:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const singleConsent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const consentId = req.params.consentId;

    const userConsent = await UserConsent.findOne({
      userId,
      consentId,
    }).populate([
      { path: "consentId", populate: { path: "dataEntityId" } },
      { path: "purposeId" },
      {
        path: "consentMetaDataId",
      },
    ]);

    if (!userConsent) {
      return res
        .status(404)
        .json({ success: false, message: "Consent not found for this user" });
    }

    res.status(200).json({ success: true, data: userConsent });
  } catch (error) {
    console.error("Error fetching single consent:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const withdrawConsent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userConsentId = req.params.userConsentId;

    const userConsent = await UserConsent.findOne({
      _id: userConsentId,
      userId,
    }).populate([
      { path: "consentId", populate: { path: "dataEntityId" } },
      { path: "purposeId" },
      { path: "consentMetaDataId" },
    ]);

    if (!userConsent) {
      return res
        .status(404)
        .json({ success: false, message: "Consent not found for this user" });
    }

    if (userConsent.status === "WITHDRAWN") {
      return res.status(200).json({
        success: true,
        message: "Consent already withdrawn",
        data: userConsent,
      });
    }

    const now = new Date();
    const expiryAt = userConsent.expiryAt
      ? new Date(userConsent.expiryAt)
      : null;
    const isExpired = expiryAt && expiryAt < now;

    if (userConsent.status !== "GRANTED" || isExpired) {
      return res.status(400).json({
        success: false,
        message: "Only active consents can be withdrawn",
      });
    }

    userConsent.status = "WITHDRAWN";
    userConsent.withdrawnAt = now;

    await userConsent.save();

    return res
      .status(200)
      .json({ success: true, message: "Consent withdrawn", data: userConsent });
  } catch (error) {
    console.error("Withdraw Consent Error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  listAllConsents,
  singleConsent,
  withdrawConsent,
};
