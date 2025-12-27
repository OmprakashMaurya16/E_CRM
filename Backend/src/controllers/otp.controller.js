const User = require("../models/user.model");
const { generateOTP, hashOTP } = require("../utils/otp");
const { getTransporter } = require("../config/email");
const { generateToken } = require("../utils/jwt");

const requestOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role)
      return res.status(400).json({ message: "Email and role are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== role)
      return res
        .status(400)
        .json({ message: "Email does not exist for the specified role" });

    const otp = generateOTP();
    user.otpHash = hashOTP(otp);
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    await user.save();

    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: "Your One-Time Passcode",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });

    try {
      const previewUrl = require("nodemailer").getTestMessageUrl(info);
      if (previewUrl) console.log("OTP preview URL:", previewUrl);
    } catch {}

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
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (
      !user ||
      !user.otpHash ||
      !user.otpExpiresAt ||
      user.otpExpiresAt < Date.now() ||
      hashOTP(otp) !== user.otpHash
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();

    const publicUser = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      entityId: user.entityId,
      status: user.status,
    };

    return res.status(200).json({
      success: true,
      message: "OTP verified. Login successful",
      token: generateToken(user),
      user: publicUser,
    });
  } catch (error) {
    console.error("OTP Verification Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

module.exports = { requestOtp, verifyOtp };
