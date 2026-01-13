const UserConsent = require("../models/userConsent.model");
const ConsentMetaData = require("../models/consentMetaData.model");
const DataEntity = require("../models/dataEntity.model");
const Consent = require("../models/consent.model");
const Purpose = require("../models/purpose.model");
const User = require("../models/user.model");

const listAllUserConsents = async (req, res) => {
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

const singleUserConsent = async (req, res) => {
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

const withdrawUserConsent = async (req, res) => {
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

const getFiduciaryConsents = async (req, res) => {
  try {
    const fiduciaryId = req.user?.entityId;

    if (!fiduciaryId) {
      return res.status(400).json({
        success: false,
        message: "Missing fiduciary context",
      });
    }

    const consentIds = await Consent.find({
      dataEntityId: fiduciaryId,
    }).distinct("_id");

    const [userConsents, distinctPrincipals, activeProcessors] =
      await Promise.all([
        UserConsent.find({ consentId: { $in: consentIds } })
          .populate([
            { path: "consentId", populate: { path: "dataEntityId" } },
            { path: "purposeId" },
            {
              path: "consentMetaDataId",
              select: "methodOfCollection version",
            },
          ])
          .populate({ path: "userId", select: "fullName" }),
        UserConsent.distinct("userId", { consentId: { $in: consentIds } }),
        DataEntity.countDocuments({
          entityType: "DATA_PROCESSOR",
          status: "ACTIVE",
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        consentsList: userConsents,
        metrics: {
          consents: userConsents.length,
          principals: distinctPrincipals.length,
          processors: activeProcessors,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching fiduciary data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getFiduciaryPrincipals = async (req, res) => {
  try {
    const fiduciaryId = req.user?.entityId;

    if (!fiduciaryId) {
      return res.status(400).json({
        success: false,
        message: "Missing fiduciary context",
      });
    }

    const consentIds = await Consent.find({
      dataEntityId: fiduciaryId,
    }).distinct("_id");

    const principalIds = await UserConsent.distinct("userId", {
      consentId: { $in: consentIds },
    });

    const principals = await User.find({ _id: { $in: principalIds } }).select(
      "fullName email role createdAt"
    );

    return res.status(200).json({
      success: true,
      data: {
        principals,
        metrics: { principals: principals.length },
      },
    });
  } catch (error) {
    console.error("Error fetching fiduciary principals:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getFiduciaryProcessors = async (req, res) => {
  try {
    const processors = await DataEntity.find({
      entityType: "DATA_PROCESSOR",
      status: "ACTIVE",
    }).select("name status createdAt");

    return res.status(200).json({
      success: true,
      data: {
        processors,
        metrics: { processors: processors.length },
      },
    });
  } catch (error) {
    console.error("Error fetching fiduciary processors:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getFiduciaryUserConsentDetail = async (req, res) => {
  try {
    const fiduciaryId = req.user?.entityId;
    const userConsentId = req.params.userConsentId;

    if (!fiduciaryId) {
      return res.status(400).json({
        success: false,
        message: "Missing fiduciary context",
      });
    }

    const record = await UserConsent.findById(userConsentId).populate([
      { path: "consentId", populate: { path: "dataEntityId" } },
      { path: "purposeId" },
      { path: "consentMetaDataId" },
      { path: "userId", select: "fullName email" },
    ]);

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Consent not found" });
    }

    const ownerEntityId = record?.consentId?.dataEntityId?._id;
    if (!ownerEntityId || String(ownerEntityId) !== String(fiduciaryId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this consent",
      });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error("Error fetching fiduciary consent detail:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  listAllUserConsents,
  singleUserConsent,
  withdrawUserConsent,
  getFiduciaryConsents,
  getFiduciaryPrincipals,
  getFiduciaryProcessors,
  getFiduciaryUserConsentDetail,
};
