require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.SEED_ADMIN_EMAIL || "admin@collegestay.com";
  const existing = await User.findOne({ email });

  if (existing) {
    console.log("Admin already exists:", email);
  } else {
    await User.create({
      fullName: "Super Admin",
      email,
      password: process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!",
      role: "admin",
      isEmailVerified: true,
    });
    console.log("Admin created:", email);
  }

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
