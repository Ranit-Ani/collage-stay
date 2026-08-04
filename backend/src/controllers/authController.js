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

  const otp = user.generateEmailVerificationOTP();
  await user.save();

  // Respond immediately — don't make the user wait on SMTP, which can be slow
  // or hang if Brevo is misconfigured. The email is fired in the background;
  // if it fails, the "Resend code" button on the OTP page covers that.
  sendSuccess(
    res,
    201,
    "Registration successful. We've emailed you a 6-digit verification code.",
    { userId: user._id, email: user.email }
  );

  sendEmail({
    to: user.email,
    subject: "Your CollegeStay verification code",
    html: verificationEmailTemplate(user.fullName, otp),
  }).catch((err) => {
    console.error("Failed to send verification email:", err.message);
  });
});

// @desc    Verify email using the 6-digit OTP sent by email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select(
    "+emailVerificationOTP +emailVerificationOTPExpires +emailVerificationAttempts"
  );
  if (!user) throw new AppError("No account found with this email.", 404);
  if (user.isEmailVerified) throw new AppError("Email is already verified.", 400);

  if (!user.emailVerificationOTP || !user.emailVerificationOTPExpires || user.emailVerificationOTPExpires < Date.now()) {
    throw new AppError("This code has expired. Please request a new one.", 400);
  }
  if (user.emailVerificationAttempts >= 5) {
    throw new AppError("Too many incorrect attempts. Please request a new code.", 429);
  }

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  if (hashedOtp !== user.emailVerificationOTP) {
    user.emailVerificationAttempts += 1;
    await user.save();
    const remaining = 5 - user.emailVerificationAttempts;
    throw new AppError(
      `Incorrect code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : "Please request a new code."}`,
      400
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationOTP = undefined;
  user.emailVerificationOTPExpires = undefined;
  user.emailVerificationAttempts = 0;
  await user.save();

  sendSuccess(res, 200, "Email verified successfully. You can now log in.");
});

// @desc    Resend a fresh verification OTP
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) throw new AppError("No account found with this email.", 404);
  if (user.isEmailVerified) throw new AppError("Email is already verified.", 400);

  const otp = user.generateEmailVerificationOTP();
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Your CollegeStay verification code",
    html: verificationEmailTemplate(user.fullName, otp),
  });

  sendSuccess(res, 200, "A new verification code has been sent to your email.");
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
