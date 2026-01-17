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
  renewUserConsent,
  renewFiduciaryUserConsent,
  withdrawFiduciaryUserConsent,
} = require("../controllers/consent.contoller");
const requireAuth = require("../middleware/requireAuth");

router.get("/consents", requireAuth, listAllUserConsents);
router.get("/consents/:consentId", requireAuth, singleUserConsent);
router.post(
  "/consents/:userConsentId/withdraw",
  requireAuth,
  withdrawUserConsent,
);
router.post("/consents/:userConsentId/renew", requireAuth, renewUserConsent);
router.get("/fiduciary/consents", requireAuth, getFiduciaryConsents);
router.get("/fiduciary/principals", requireAuth, getFiduciaryPrincipals);
router.get("/fiduciary/processors", requireAuth, getFiduciaryProcessors);
router.get(
  "/fiduciary/user-consents/:userConsentId",
  requireAuth,
  getFiduciaryUserConsentDetail,
);
router.post(
  "/fiduciary/user-consents/:userConsentId/renew",
  requireAuth,
  renewFiduciaryUserConsent,
);
router.post(
  "/fiduciary/user-consents/:userConsentId/withdraw",
  requireAuth,
  withdrawFiduciaryUserConsent,
);

module.exports = router;
