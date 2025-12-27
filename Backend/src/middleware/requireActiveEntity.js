const DataEntity = require("../models/dataEntity.model");

const requireActiveEntity = async (req, res, next) => {
  if (!req.user.entityId) return next();

  const entity = await DataEntity.findById(req.user.entityId);

  if (!entity || entity.status !== "ACTIVE") {
    return res.status(403).json({
      message: "Associated entity is suspended",
    });
  }

  next();
};

module.exports = requireActiveEntity;
