import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <div className="flex max-w-7xl mx-auto">
        <Sidebar role={user?.role} />
        <main className="flex-1 px-4 sm:px-6 py-8 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
