module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role?.toLowerCase())) {
      return res.status(403).json({ message: "You do not have permission for this action" });
    }
    next();
  };
};
