const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["student", "homeowner", "admin"],
      default: "student",
    },
    phone: { type: String, default: "" },
    profilePicture: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    // Student-specific
    collegeName: { type: String, default: "" },
    favouriteProperties: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    ],

    // Home owner-specific
    businessName: { type: String, default: "" },

    // Verification / status
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationOTP: { type: String, select: false },
    emailVerificationOTPExpires: { type: Date, select: false },
    emailVerificationAttempts: { type: Number, default: 0, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    isActive: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateEmailVerificationOTP = function () {
  // 6-digit numeric code, e.g. "042817"
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationOTP = crypto.createHash("sha256").update(otp).digest("hex");
  this.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.emailVerificationAttempts = 0;
  return otp;
};

userSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1h
  return rawToken;
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationOTP;
  delete obj.emailVerificationOTPExpires;
  delete obj.emailVerificationAttempts;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
