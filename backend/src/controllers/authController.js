const crypto = require("crypto");
const User = require("../models/User");
const asyncHandler = require("../middlewares/asyncHandler");
const { AppError } = require("../middlewares/errorMiddleware");
const { sendTokenCookie, clearTokenCookie } = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const {
  verificationEmailTemplate,
  passwordResetEmailTemplate,
} = require("../utils/emailTemplates");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Register a new user (student or homeowner)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const user = new User({
    fullName,
    email,
    password,
    role: role === "homeowner" ? "homeowner" : "student",
  });

  const rawToken = user.generateEmailVerificationToken();
  await user.save();

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your CollegeStay account",
      html: verificationEmailTemplate(user.fullName, verifyUrl),
    });
  } catch (err) {
    // Roll back verification token generation state if email fails, but keep the account
    console.error("Failed to send verification email:", err.message);
  }

  sendSuccess(
    res,
    201,
    "Registration successful. Please check your email to verify your account.",
    { userId: user._id, email: user.email }
  );
});

// @desc    Verify email using token from email link
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw new AppError("Verification link is invalid or has expired.", 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  sendSuccess(res, 200, "Email verified successfully. You can now log in.");
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) throw new AppError("No account found with this email.", 404);
  if (user.isEmailVerified) throw new AppError("Email is already verified.", 400);

  const rawToken = user.generateEmailVerificationToken();
  await user.save();

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your CollegeStay account",
    html: verificationEmailTemplate(user.fullName, verifyUrl),
  });

  sendSuccess(res, 200, "Verification email resent. Please check your inbox.");
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (user.isBlocked) {
    throw new AppError("Your account has been blocked. Contact support.", 403);
  }

  if (!user.isEmailVerified) {
    throw new AppError("Please verify your email before logging in.", 403);
  }

  sendTokenCookie(res, user._id, user.role);

  sendSuccess(res, 200, "Login successful.", { user: user.toSafeObject() });
});

// @desc    Logout user - clears auth cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  clearTokenCookie(res);
  sendSuccess(res, 200, "Logged out successfully.");
});

// @desc    Get current authenticated user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, "Current user fetched.", { user: req.user.toSafeObject() });
});

// @desc    Request password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Respond identically whether or not the user exists to avoid leaking account info
  if (!user) {
    return sendSuccess(
      res,
      200,
      "If an account exists with this email, a reset link has been sent."
    );
  }

  const rawToken = user.generatePasswordResetToken();
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your CollegeStay password",
    html: passwordResetEmailTemplate(user.fullName, resetUrl),
  });

  sendSuccess(
    res,
    200,
    "If an account exists with this email, a reset link has been sent."
  );
});

// @desc    Reset password using token from email link
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new AppError("Reset link is invalid or has expired.", 400);
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendSuccess(res, 200, "Password reset successful. Please log in.");
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
