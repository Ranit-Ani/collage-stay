require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/config/socket");
const { runPeriodicBookingChecks } = require("./src/services/bookingService");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Attach Socket.IO to the same HTTP server
const io = initSocket(server);

// Make io accessible in controllers via req.app.get("io")
app.set("io", io);

// Auto-expires unpaid bookings past their payment deadline, and auto-promotes
// paid bookings to "Move-in Pending" once their move-in date arrives. Runs on
// a timer rather than a real job queue to keep this deployable anywhere
// (single process, no extra infra) — swap for a proper scheduler/queue if the
// app grows beyond a single instance.
const BOOKING_CHECK_INTERVAL_MS = (Number(process.env.BOOKING_CHECK_INTERVAL_MINUTES) || 15) * 60 * 1000;
const runBookingChecks = () => {
  runPeriodicBookingChecks(io).catch((err) =>
    console.error("Booking auto-check failed:", err.message)
  );
};

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`CollegeStay API running on port ${PORT} [${process.env.NODE_ENV}]`);
    setTimeout(runBookingChecks, 10_000); // once shortly after startup
    setInterval(runBookingChecks, BOOKING_CHECK_INTERVAL_MS);
  });
};

start();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});
