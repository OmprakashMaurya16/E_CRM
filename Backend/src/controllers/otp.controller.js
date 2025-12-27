const User = require("../models/user.model");
const { generateOtp, hashOtp } = require("../utils/otp");
const transporter = require("../config/email");

const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();

    user.otpHash = hashOtp(otp);
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      to: user.email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to registered email",
    });
  } catch (error) {
    console.error("OTP Request Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during OTP request",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });

    if (
      !user ||
      !user.otpHash ||
      user.otpExpiresAt < Date.now() ||
      hashOtp(otp) !== user.otpHash
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otpHash = null;
    user.otpExpiresAt = null;

    user.passwordHash = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified and password reset successful",
    });
  } catch (error) {
    console.error("OTP Verification Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
};
