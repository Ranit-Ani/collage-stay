const express = require("express");
const router = express.Router();
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { validate } = require("../middlewares/validateMiddleware");
const { protect } = require("../middlewares/authMiddleware");
const {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/authValidator");

router.post("/register", validate(registerValidator), register);
router.post("/verify-email", validate(verifyEmailValidator), verifyEmail);
router.post("/resend-verification", validate(resendVerificationValidator), resendVerification);
router.post("/login", validate(loginValidator), login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/forgot-password", validate(forgotPasswordValidator), forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordValidator), resetPassword);

module.exports = router;
