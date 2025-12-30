const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  logout,
} = require("../controllers/auth.controller");
const requireAuth = require("../middleware/requireAuth");
const requireActiveUser = require("../middleware/requireActiveUser");
const { requestOtp, verifyOtp } = require("../controllers/otp.controller");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/register", upload.single("logo"), registerUser);
router.post("/login", loginUser);
router.post("/otp/request", requestOtp);
router.post("/otp/verify", verifyOtp);

// Profile & security
router.get("/me", requireAuth, requireActiveUser, getProfile);
router.put("/profile", requireAuth, requireActiveUser, updateProfile);
router.post("/change-password", requireAuth, requireActiveUser, changePassword);
router.post("/logout", requireAuth, requireActiveUser, logout);

module.exports = router;
