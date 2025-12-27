const requireRole = (...allowRoles) => {
  return (req, res, next) => {
    if (!allowRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Insufficient role permissions",
      });
    }

    next();
  };
};
module.exports = requireRole;
