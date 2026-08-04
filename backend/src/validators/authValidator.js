const { body } = require("express-validator");

const registerValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
  body("role")
    .optional()
    .isIn(["student", "homeowner"])
    .withMessage("Role must be student or homeowner"),
];

const loginValidator = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const verifyEmailValidator = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("Code must be 6 digits")
    .isNumeric()
    .withMessage("Code must be numeric"),
];

const resendVerificationValidator = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
];

const forgotPasswordValidator = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
];

const resetPasswordValidator = [
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];

module.exports = {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
