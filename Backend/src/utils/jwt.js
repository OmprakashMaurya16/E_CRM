const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
      entityId: user.entityId || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

module.exports = { generateToken };
