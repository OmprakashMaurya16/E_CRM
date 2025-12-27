const User = require("../models/user.model");
const DataEntity = require("../models/dataEntity.model");
const { generateToken } = require("../utils/jwt");
const cloudinary = require("../config/cloudinary");
const bcrypt = require("bcrypt");
const fs = require("fs");

const ALLOWED_ROLES = [
  "DATA_PRINCIPAL",
  "DATA_FIDUCIARY",
  "DATA_PROCESSOR",
  "ADMIN",
];

const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role, phone } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    if (role === "DATA_PRINCIPAL" && !phone) {
      return res.status(400).json({
        message: "Phone number is required for Data Principal",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    let entityId = null;

    if (role === "DATA_FIDUCIARY") {
      if (!req.file) {
        return res.status(400).json({ message: "Logo required" });
      }

      let upload;
      try {
        upload = await cloudinary.uploader.upload(req.file.path);
      } finally {
        fs.unlinkSync(req.file.path);
      }

      const entity = await DataEntity.create({
        name: req.body.entityName,
        contactEmail: req.body.entityEmail,
        entityType: "DATA_FIDUCIARY",
        logoUrl: upload.secure_url,
      });

      entityId = entity._id;
    }

    const user = await User.create({
      fullName,
      email,
      phone: role === "DATA_PRINCIPAL" ? phone : null,
      passwordHash: password,
      role,
      entityId,
      termsAcceptedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: generateToken(user),
    });
  } catch (error) {
    console.error("Registration Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error during registration",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: generateToken(user),
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server Error during login" });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
