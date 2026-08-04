const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const rateLimiter = require("./middlewares/rateLimiter");
const errorMiddleware = require("./middlewares/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const homeOwnerRoutes = require("./routes/homeOwnerRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(rateLimiter);

// Root - friendly response for anyone hitting the bare backend URL
// (also useful as Render's health check target if you point it at "/")
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CollegeStay API is running. See /api/health for a health check.",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "CollegeStay API is healthy" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/home-owners", homeOwnerRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Centralized error handler (must be last)
app.use(errorMiddleware);

module.exports = app;
