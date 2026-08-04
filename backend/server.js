require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/config/socket");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Attach Socket.IO to the same HTTP server
const io = initSocket(server);

// Make io accessible in controllers via req.app.get("io")
app.set("io", io);

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`CollegeStay API running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

start();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});
