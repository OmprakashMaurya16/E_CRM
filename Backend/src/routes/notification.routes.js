const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const {
  listPrincipalNotifications,
  listFiduciaryNotifications,
  getPrincipalUnreadCount,
  markPrincipalNotificationsRead,
  getFiduciaryUnreadCount,
  markFiduciaryNotificationsRead,
  handleFiduciaryNotificationApprove,
  handleFiduciaryNotificationReject,
} = require("../controllers/notification.controller");

// Data Principal notifications
router.get("/principal/notifications", requireAuth, listPrincipalNotifications);

// Data Principal unread notifications count
router.get(
  "/principal/notifications/unread-count",
  requireAuth,
  getPrincipalUnreadCount,
);

// Mark all Data Principal notifications as read
router.post(
  "/principal/notifications/mark-read",
  requireAuth,
  markPrincipalNotificationsRead,
);

// Data Fiduciary notifications (incoming requests)
router.get("/fiduciary/notifications", requireAuth, listFiduciaryNotifications);

// Data Fiduciary unread notifications count
router.get(
  "/fiduciary/notifications/unread-count",
  requireAuth,
  getFiduciaryUnreadCount,
);

// Mark all Data Fiduciary notifications as read
router.post(
  "/fiduciary/notifications/mark-read",
  requireAuth,
  markFiduciaryNotificationsRead,
);

// Data Fiduciary approves a request
router.post(
  "/fiduciary/notifications/:notificationId/approve",
  requireAuth,
  handleFiduciaryNotificationApprove,
);

// Data Fiduciary rejects a request
router.post(
  "/fiduciary/notifications/:notificationId/reject",
  requireAuth,
  handleFiduciaryNotificationReject,
);

module.exports = router;
