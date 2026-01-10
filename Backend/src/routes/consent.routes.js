const express = require("express");
const router = express.Router();
const {
  listAllUserConsents,
  singleUserConsent,
  withdrawUserConsent,
  getFiduciaryConsents,
  getFiduciaryPrincipals,
  getFiduciaryProcessors,
} = require("../controllers/consent.contoller");
const requireAuth = require("../middleware/requireAuth");

router.get("/consents", requireAuth, listAllUserConsents);
router.get("/consents/:consentId", requireAuth, singleUserConsent);
router.post(
  "/consents/:userConsentId/withdraw",
  requireAuth,
  withdrawUserConsent
);
router.get("/fiduciary/consents", requireAuth, getFiduciaryConsents);
router.get("/fiduciary/principals", requireAuth, getFiduciaryPrincipals);
router.get("/fiduciary/processors", requireAuth, getFiduciaryProcessors);

module.exports = router;
