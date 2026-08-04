const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const User = require("../models/User");
const { AppError } = require("./errorMiddleware");

/**
 * Protects routes: verifies JWT from httpOnly cookie (or Bearer header as fallback),
 * attaches the authenticated user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.[process.env.JWT_COOKIE_NAME || "cs_token"];

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AppError("Not authenticated. Please log in.", 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new AppError("User no longer exists or is inactive.", 401);
  }
  if (user.isBlocked) {
    throw new AppError("Your account has been blocked. Contact support.", 403);
  }

  req.user = user;
  next();
});

module.exports = { protect };
