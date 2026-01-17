const UserConsent = require("../models/userConsent.model");
const ConsentMetaData = require("../models/consentMetaData.model");
const DataEntity = require("../models/dataEntity.model");
const Consent = require("../models/consent.model");
const Purpose = require("../models/purpose.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

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
    const role = req.user.role;
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

    // Data Principal cannot directly withdraw; create a request for the Data Fiduciary
    if (role === "DATA_PRINCIPAL") {
      const fiduciaryEntityId = userConsent?.consentId?.dataEntityId?._id;
      if (!fiduciaryEntityId) {
        return res.status(400).json({
          success: false,
          message: "Associated Data Fiduciary not found for this consent",
        });
      }

      const existing = await Notification.findOne({
        userConsentId: userConsent._id,
        dataPrincipalId: userId,
        fiduciaryEntityId,
        type: "WITHDRAW_REQUEST",
        status: "PENDING",
      });

      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Withdraw request already pending with Data Fiduciary",
        });
      }

      await Notification.create({
        userConsentId: userConsent._id,
        dataPrincipalId: userId,
        fiduciaryEntityId,
        type: "WITHDRAW_REQUEST",
        fromRole: "DATA_PRINCIPAL",
        toRole: "DATA_FIDUCIARY",
        status: "PENDING",
        message: "Data Principal requested to withdraw this consent.",
      });

      return res.status(200).json({
        success: true,
        message: "Withdraw request sent to Data Fiduciary",
      });
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

    const now = new Date();
    const activePrincipalFilter = {
      consentId: { $in: consentIds },
      status: "GRANTED",
      expiryAt: { $gte: now },
    };

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
        UserConsent.distinct("userId", activePrincipalFilter),
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

    const now = new Date();
    const activePrincipalFilter = {
      consentId: { $in: consentIds },
      status: "GRANTED",
      expiryAt: { $gte: now },
    };

    const principalIds = await UserConsent.distinct(
      "userId",
      activePrincipalFilter,
    );

    const principals = await User.find({ _id: { $in: principalIds } }).select(
      "fullName email role createdAt",
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

// Withdraw consent (Data Fiduciary context)
const withdrawFiduciaryUserConsent = async (req, res) => {
  try {
    const fiduciaryId = req.user?.entityId;
    const userConsentId = req.params.userConsentId;

    if (!fiduciaryId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fiduciary context" });
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
        message: "Not authorized to withdraw this consent",
      });
    }

    if (record.status === "WITHDRAWN") {
      return res.status(200).json({
        success: true,
        message: "Consent already withdrawn",
        data: record,
      });
    }

    const now = new Date();
    const expiryAt = record.expiryAt ? new Date(record.expiryAt) : null;
    const isExpired = expiryAt && expiryAt < now;

    if (record.status !== "GRANTED" || isExpired) {
      return res.status(400).json({
        success: false,
        message: "Only active consents can be withdrawn",
      });
    }

    record.status = "WITHDRAWN";
    record.withdrawnAt = now;

    await record.save();

    return res
      .status(200)
      .json({ success: true, message: "Consent withdrawn", data: record });
  } catch (error) {
    console.error("Withdraw Fiduciary Consent Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Renew consent (Data Principal context)
const renewUserConsent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const userConsentId = req.params.userConsentId;

    const record = await UserConsent.findOne({
      _id: userConsentId,
      userId,
    }).populate([
      { path: "consentId", populate: { path: "dataEntityId" } },
      { path: "purposeId" },
      { path: "consentMetaDataId" },
    ]);

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Consent not found for this user" });
    }

    // Data Principal cannot directly renew; create a request for the Data Fiduciary
    if (role === "DATA_PRINCIPAL") {
      const fiduciaryEntityId = record?.consentId?.dataEntityId?._id;
      if (!fiduciaryEntityId) {
        return res.status(400).json({
          success: false,
          message: "Associated Data Fiduciary not found for this consent",
        });
      }

      const existing = await Notification.findOne({
        userConsentId: record._id,
        dataPrincipalId: userId,
        fiduciaryEntityId,
        type: "RENEW_REQUEST",
        status: "PENDING",
      });

      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Renew request already pending with Data Fiduciary",
        });
      }

      await Notification.create({
        userConsentId: record._id,
        dataPrincipalId: userId,
        fiduciaryEntityId,
        type: "RENEW_REQUEST",
        fromRole: "DATA_PRINCIPAL",
        toRole: "DATA_FIDUCIARY",
        status: "PENDING",
        message: "Data Principal requested to renew this consent.",
      });

      return res.status(200).json({
        success: true,
        message: "Renew request sent to Data Fiduciary",
      });
    }
    // For non-Data Principal roles (if used), fall back to direct renewal
    const now = new Date();
    const prevGiven = record.givenAt ? new Date(record.givenAt) : null;
    const prevExpiry = record.expiryAt ? new Date(record.expiryAt) : null;
    let durationMs = 30 * 24 * 60 * 60 * 1000; // default 30 days fallback
    if (prevGiven && prevExpiry && prevExpiry > prevGiven) {
      durationMs = prevExpiry.getTime() - prevGiven.getTime();
    }

    record.status = "GRANTED";
    record.withdrawnAt = null;
    record.givenAt = now;
    record.expiryAt = new Date(now.getTime() + durationMs);

    await record.save();

    return res
      .status(200)
      .json({ success: true, message: "Consent renewed", data: record });
  } catch (error) {
    console.error("Renew Consent Error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Renew consent (Data Fiduciary context)
const renewFiduciaryUserConsent = async (req, res) => {
  try {
    const fiduciaryId = req.user?.entityId;
    const userConsentId = req.params.userConsentId;

    if (!fiduciaryId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fiduciary context" });
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
        message: "Not authorized to renew this consent",
      });
    }

    const now = new Date();
    const prevGiven = record.givenAt ? new Date(record.givenAt) : null;
    const prevExpiry = record.expiryAt ? new Date(record.expiryAt) : null;
    let durationMs = 30 * 24 * 60 * 60 * 1000; // default 30 days fallback
    if (prevGiven && prevExpiry && prevExpiry > prevGiven) {
      durationMs = prevExpiry.getTime() - prevGiven.getTime();
    }

    record.status = "GRANTED";
    record.withdrawnAt = null;
    record.givenAt = now;
    record.expiryAt = new Date(now.getTime() + durationMs);

    await record.save();

    return res
      .status(200)
      .json({ success: true, message: "Consent renewed", data: record });
  } catch (error) {
    console.error("Renew Fiduciary Consent Error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
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
  renewUserConsent,
  renewFiduciaryUserConsent,
  withdrawFiduciaryUserConsent,
};
