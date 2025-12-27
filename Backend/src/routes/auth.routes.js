const express = require("express");
const { registerUser, loginUser } = require("../controllers/auth.controller");
const { requestOtp, verifyOtp } = require("../controllers/otp.controller");
const upload = require("../middleware/upload");

const router = express.Router();

router.post("/register", upload.single("logo"), registerUser);
router.post("/login", loginUser);
router.post("/otp/request", requestOtp);
router.post("/otp/verify", verifyOtp);

module.exports = router;
