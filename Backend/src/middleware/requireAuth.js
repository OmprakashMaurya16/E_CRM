const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.sub,
      role: decoded.role,
      entityId: decoded.entityId || null,
    };
    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error in Authentication",
    });
  }
};

module.exports = requireAuth;
