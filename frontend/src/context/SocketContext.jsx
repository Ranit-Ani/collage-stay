import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { getToken } from "../utils/authToken";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Pass this tab's own token explicitly — with multiple users logged in
    // across different tabs, the shared cookie isn't reliable for figuring
    // out which user this particular socket belongs to.
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      withCredentials: true,
      auth: { token: getToken() },
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Global toast for any in-app notification, regardless of which page is open
    socket.on("notificationReceived", (notification) => {
      toast(notification.title || "New notification", { icon: "🔔" });
    });

    // If an admin blocks this account in another tab/device, sign this
    // session out immediately instead of leaving it stale.
    socket.on("accountBlocked", () => {
      toast.error("Your account has been blocked by an admin.");
      logout();
    });

    return () => {
      socket.disconnect();
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
};
