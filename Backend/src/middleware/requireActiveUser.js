const User = require("../models/user.model");

const requireActiveUser = async (req, res, next) => {
  const user = await User.findById(req.user.userId);

  if (!user || user.status !== "ACTIVE") {
    return res.status(403).json({
      success: false,
      message: "User account is inactive",
    });
  }

  next();
};

module.exports = requireActiveUser;
