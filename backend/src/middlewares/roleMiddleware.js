const { AppError } = require("./errorMiddleware");

/**
 * Restricts a route to one or more roles.
 * Usage: authorize("admin"), authorize("student", "homeowner")
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Not authenticated.", 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not permitted to access this resource.`,
          403
        )
      );
    }
    next();
  };
};

module.exports = { authorize };
