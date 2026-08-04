import React, { useState } from "react";
import { Menu } from "lucide-react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />

      {/* Mobile/tablet-only bar: 3-line menu button opens the dashboard sidebar,
          since the sidebar itself is hidden below the lg breakpoint. */}
      <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-ink-100 px-4 py-2.5">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 text-ink-700 p-1.5 -ml-1.5 rounded-lg hover:bg-ink-50"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
          <span className="text-sm font-medium">Menu</span>
        </button>
      </div>

      <div className="flex max-w-7xl mx-auto">
        <Sidebar role={user?.role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 sm:px-6 py-8 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
