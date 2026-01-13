const express = require("express");
const router = express.Router();
const {
  listAllUserConsents,
  singleUserConsent,
  withdrawUserConsent,
  getFiduciaryConsents,
  getFiduciaryPrincipals,
  getFiduciaryProcessors,
  getFiduciaryUserConsentDetail,
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
router.get(
  "/fiduciary/user-consents/:userConsentId",
  requireAuth,
  getFiduciaryUserConsentDetail
);

module.exports = router;
