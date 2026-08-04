const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const User = require("../models/User");
const { AppError } = require("./errorMiddleware");

/**
 * Protects routes: verifies JWT from the Authorization Bearer header
 * (falling back to the httpOnly cookie only if no header is present).
 *
 * Bearer is checked first on purpose: the frontend stores the token in
 * sessionStorage, which is scoped per browser tab, so each tab can carry
 * a different user's token even though they all share the same cookie jar.
 * This is what lets someone be logged in as two different users in two
 * tabs of the same browser at the same time.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    token = req.cookies?.[process.env.JWT_COOKIE_NAME || "cs_token"];
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
