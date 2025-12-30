const express = require("express");
const router = express.Router();
const {
  listAllConsents,
  singleConsent,
  withdrawConsent,
} = require("../controllers/consent.contoller");
const requireAuth = require("../middleware/requireAuth");

router.get("/consents", requireAuth, listAllConsents);
router.get("/consents/:consentId", requireAuth, singleConsent);
router.post("/consents/:userConsentId/withdraw", requireAuth, withdrawConsent);
module.exports = router;
