const User = require("../models/user.model");
const DataEntity = require("../models/dataEntity.model");
const { generateToken } = require("../utils/jwt");
const cloudinary = require("../config/cloudinary");
const bcrypt = require("bcrypt");
const stream = require("stream");

const ALLOWED_ROLES = ["DATA_PRINCIPAL", "DATA_FIDUCIARY", "DATA_PROCESSOR"];

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

      const upload = await new Promise((resolve, reject) => {
        const passthrough = new stream.PassThrough();
        const options = { folder: "ecrm/logos" };
        const uploader = cloudinary.uploader.upload_stream(
          options,
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          },
        );
        passthrough.end(req.file.buffer);
        passthrough.pipe(uploader);
      });

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

    const dataEntityUser = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      entityId: user.entityId,
      status: user.status,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: generateToken(user),
      user: dataEntityUser,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server Error during login" });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const data = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      entityId: user.entityId,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({ success: true, user: data });
  } catch (error) {
    console.error("Get Profile Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server Error while fetching profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { fullName, phone } = req.body;

    if (typeof fullName === "string") {
      const trimmed = fullName.trim();
      if (trimmed.length < 3 || trimmed.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Full name must be 3-50 characters",
        });
      }
      user.fullName = trimmed;
    }

    if (typeof phone === "string") {
      user.phone = phone.trim() || null;
    }

    await user.save();

    const data = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      entityId: user.entityId,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res
      .status(200)
      .json({ success: true, message: "Profile updated", user: data });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server Error while updating profile" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required",
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }

    user.passwordHash = newPassword;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error while changing password",
    });
  }
};

const logout = async (_req, res) => {
  return res.status(200).json({ success: true, message: "Logged out" });
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  logout,
};
