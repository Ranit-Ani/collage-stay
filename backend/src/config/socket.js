const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let ioInstance = null;

/**
 * Initializes Socket.IO on top of the HTTP server.
 * Each authenticated client joins a room named after their userId,
 * so the backend can emit targeted events like `notificationReceived`.
 * Public events (e.g. availabilityUpdated) are broadcast to everyone.
 */
const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split("; ")
          .find((c) => c.startsWith(`${process.env.JWT_COOKIE_NAME}=`))
          ?.split("=")[1];

      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.role = decoded.role;
      }
      next();
    } catch (err) {
      // Allow anonymous connection for public broadcast events (e.g. availability updates)
      next();
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) {
      socket.join(socket.userId.toString());
    }
    // Admins join a shared room for listing approval events
    if (socket.role === "admin") {
      socket.join("admins");
    }

    socket.on("disconnect", () => {
      // no-op, room membership is cleaned up automatically
    });
  });

  ioInstance = io;
  return io;
};

const getIO = () => {
  if (!ioInstance) throw new Error("Socket.IO not initialized");
  return ioInstance;
};

module.exports = { initSocket, getIO };
