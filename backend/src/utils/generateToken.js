const jwt = require("jsonwebtoken");

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

/**
 * Signs a JWT and sets it as an httpOnly cookie on the response.
 */
const sendTokenCookie = (res, userId, role) => {
  const token = generateToken(userId, role);
  const cookieName = process.env.JWT_COOKIE_NAME || "cs_token";

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

const clearTokenCookie = (res) => {
  const cookieName = process.env.JWT_COOKIE_NAME || "cs_token";
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
};

module.exports = { generateToken, sendTokenCookie, clearTokenCookie };