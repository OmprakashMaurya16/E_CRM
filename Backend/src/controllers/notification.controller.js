const Notification = require("../models/notification.model");
const UserConsent = require("../models/userConsent.model");

// List notifications for Data Principal
const listPrincipalNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await Notification.find({
      dataPrincipalId: userId,
      toRole: "DATA_PRINCIPAL",
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({
        path: "userConsentId",
        populate: [
          { path: "consentId", populate: { path: "dataEntityId" } },
          { path: "purposeId" },
        ],
      });

    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("List Principal Notifications Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Get unread notifications count for Data Principal
const getPrincipalUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const count = await Notification.countDocuments({
      dataPrincipalId: userId,
      toRole: "DATA_PRINCIPAL",
      readAt: null,
    });

    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Principal Unread Notifications Count Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Mark all Data Principal notifications as read
const markPrincipalNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await Notification.updateMany(
      {
        dataPrincipalId: userId,
        toRole: "DATA_PRINCIPAL",
        readAt: null,
      },
      { $set: { readAt: new Date() } },
    );

    return res.status(200).json({
      success: true,
      updated: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error("Mark Principal Notifications Read Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// List notifications for Data Fiduciary (incoming requests)
const listFiduciaryNotifications = async (req, res) => {
  try {
    const fiduciaryId = req.user?.entityId;

    if (!fiduciaryId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fiduciary context" });
    }

    const notifications = await Notification.find({
      fiduciaryEntityId: fiduciaryId,
      toRole: "DATA_FIDUCIARY",
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({
        path: "userConsentId",
        populate: [
          { path: "consentId", populate: { path: "dataEntityId" } },
          { path: "purposeId" },
        ],
      })
      .populate({ path: "dataPrincipalId", select: "fullName email" });

    return res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("List Fiduciary Notifications Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Get unread notifications count for Data Fiduciary
const getFiduciaryUnreadCount = async (req, res) => {
  try {
    const fiduciaryId = req.user?.entityId;

    if (!fiduciaryId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fiduciary context" });
    }

    const count = await Notification.countDocuments({
      fiduciaryEntityId: fiduciaryId,
      toRole: "DATA_FIDUCIARY",
      status: "PENDING",
      readAt: null,
    });

    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Fiduciary Unread Notifications Count Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Mark all Data Fiduciary notifications as read (without changing status)
const markFiduciaryNotificationsRead = async (req, res) => {
  try {
    const fiduciaryId = req.user?.entityId;

    if (!fiduciaryId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fiduciary context" });
    }

    const result = await Notification.updateMany(
      {
        fiduciaryEntityId: fiduciaryId,
        toRole: "DATA_FIDUCIARY",
        status: "PENDING",
        readAt: null,
      },
      { $set: { readAt: new Date() } },
    );

    return res.status(200).json({
      success: true,
      updated: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error("Mark Fiduciary Notifications Read Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Fiduciary approves a pending request (withdraw or renew)
const handleFiduciaryNotificationApprove = async (req, res) => {
  try {
    const fiduciaryId = req.user?.entityId;
    const notificationId = req.params.notificationId;

    if (!fiduciaryId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fiduciary context" });
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    if (
      String(notification.fiduciaryEntityId) !== String(fiduciaryId) ||
      notification.toRole !== "DATA_FIDUCIARY"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized for this action" });
    }

    if (notification.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Notification already processed",
      });
    }

    const record = await UserConsent.findById(
      notification.userConsentId,
    ).populate([
      { path: "consentId", populate: { path: "dataEntityId" } },
      { path: "purposeId" },
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
        message: "Not authorized to modify this consent",
      });
    }

    const now = new Date();
    let actionType = null;

    if (notification.type === "WITHDRAW_REQUEST") {
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
      actionType = "WITHDRAW_ACTION";
    } else if (notification.type === "RENEW_REQUEST") {
      const prevGiven = record.givenAt ? new Date(record.givenAt) : null;
      const prevExpiry = record.expiryAt ? new Date(record.expiryAt) : null;
      let durationMs = 30 * 24 * 60 * 60 * 1000;
      if (prevGiven && prevExpiry && prevExpiry > prevGiven) {
        durationMs = prevExpiry.getTime() - prevGiven.getTime();
      }
      record.status = "GRANTED";
      record.withdrawnAt = null;
      record.givenAt = now;
      record.expiryAt = new Date(now.getTime() + durationMs);
      actionType = "RENEW_ACTION";
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported notification type for approval",
      });
    }

    await record.save();

    notification.status = "COMPLETED";
    notification.readAt = now;
    await notification.save();

    // Build contextual message for Data Principal
    const entityName =
      record?.consentId?.dataEntityId?.name || "Data Fiduciary";
    const purposeName = record?.purposeId?.purposeName || "your data";
    const expiryAtStr = record?.expiryAt
      ? new Date(record.expiryAt).toLocaleString()
      : null;

    let principalMessage = "";

    if (actionType === "WITHDRAW_ACTION") {
      principalMessage =
        `Your consent for "${purposeName}" with ${entityName}` +
        (expiryAtStr
          ? `, which was originally set to expire on ${expiryAtStr},`
          : "") +
        " has been withdrawn early by the Data Fiduciary. This stops further processing based on this consent until you provide it again.";
    } else if (actionType === "RENEW_ACTION") {
      principalMessage =
        `Your consent for "${purposeName}" with ${entityName} has been renewed.` +
        (expiryAtStr ? ` The new expiry date is ${expiryAtStr}.` : "");
    }

    // Notify Data Principal about the action
    await Notification.create({
      userConsentId: record._id,
      dataPrincipalId: notification.dataPrincipalId,
      fiduciaryEntityId: notification.fiduciaryEntityId,
      type: actionType,
      fromRole: "DATA_FIDUCIARY",
      toRole: "DATA_PRINCIPAL",
      status: "COMPLETED",
      message: principalMessage,
    });

    return res.status(200).json({
      success: true,
      message:
        actionType === "WITHDRAW_ACTION"
          ? "Consent withdrawn and Data Principal notified"
          : "Consent renewed and Data Principal notified",
      data: record,
    });
  } catch (error) {
    console.error("Approve Fiduciary Notification Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Fiduciary rejects a pending request (withdraw or renew)
const handleFiduciaryNotificationReject = async (req, res) => {
  try {
    const fiduciaryId = req.user?.entityId;
    const notificationId = req.params.notificationId;

    if (!fiduciaryId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fiduciary context" });
    }

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    if (
      String(notification.fiduciaryEntityId) !== String(fiduciaryId) ||
      notification.toRole !== "DATA_FIDUCIARY"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized for this action" });
    }

    if (notification.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Notification already processed",
      });
    }

    const now = new Date();
    let actionType = null;
    let message = null;

    // Load consent record to include contextual details (purpose, expiry, entity)
    const record = await UserConsent.findById(
      notification.userConsentId,
    ).populate([
      { path: "consentId", populate: { path: "dataEntityId" } },
      { path: "purposeId" },
    ]);

    const entityName =
      record?.consentId?.dataEntityId?.name || "Data Fiduciary";
    const purposeName = record?.purposeId?.purposeName || "your data";
    const expiryAtStr = record?.expiryAt
      ? new Date(record.expiryAt).toLocaleString()
      : null;

    if (notification.type === "WITHDRAW_REQUEST") {
      actionType = "WITHDRAW_REJECTED";
      message =
        `Your withdraw request for "${purposeName}" with ${entityName}` +
        (expiryAtStr ? ` (current expiry: ${expiryAtStr})` : "") +
        " has been rejected by the Data Fiduciary. Withdrawing consent early can improve your privacy but may limit services that rely on this consent. Your existing consent will remain active until it expires or is changed.";
    } else if (notification.type === "RENEW_REQUEST") {
      actionType = "RENEW_REJECTED";
      message =
        `Your renew request for "${purposeName}" with ${entityName} has been rejected by the Data Fiduciary.` +
        (expiryAtStr
          ? ` The consent will currently expire on ${expiryAtStr} unless updated.`
          : "");
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported notification type for rejection",
      });
    }

    notification.status = "COMPLETED";
    notification.readAt = now;
    await notification.save();

    await Notification.create({
      userConsentId: notification.userConsentId,
      dataPrincipalId: notification.dataPrincipalId,
      fiduciaryEntityId: notification.fiduciaryEntityId,
      type: actionType,
      fromRole: "DATA_FIDUCIARY",
      toRole: "DATA_PRINCIPAL",
      status: "COMPLETED",
      message,
    });

    return res.status(200).json({
      success: true,
      message: "Request rejected and Data Principal notified",
    });
  } catch (error) {
    console.error("Reject Fiduciary Notification Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  listPrincipalNotifications,
  listFiduciaryNotifications,
  getPrincipalUnreadCount,
  markPrincipalNotificationsRead,
  getFiduciaryUnreadCount,
  markFiduciaryNotificationsRead,
  handleFiduciaryNotificationApprove,
  handleFiduciaryNotificationReject,
};
