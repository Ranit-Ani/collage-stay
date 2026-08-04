import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Menu, X, Bell, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const roleHome = {
  student: "/student/dashboard",
  homeowner: "/owner/dashboard",
  admin: "/admin/dashboard",
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-semibold text-ink-900 tracking-tight">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px]">CollegeStay</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-ink-600">
          <Link to="/search" className="px-3 py-2 rounded-lg hover:bg-ink-50 hover:text-ink-900 transition-colors">
            Find a Place
          </Link>
          {user && (
            <Link to={roleHome[user.role] || "/"} className="px-3 py-2 rounded-lg hover:bg-ink-50 hover:text-ink-900 transition-colors">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <button className="p-2 rounded-lg hover:bg-ink-50 text-ink-500 transition-colors" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 text-sm text-ink-700 pl-2 pr-1 font-medium">
                <div className="h-7 w-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold">
                  {user.fullName?.[0]?.toUpperCase()}
                </div>
                {user.fullName?.split(" ")[0]}
              </div>
              <button onClick={handleLogout} className="btn-secondary !py-2 !px-3">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary !py-2 !px-3">Log in</Link>
              <Link to="/register" className="btn-primary !py-2 !px-3">Sign up</Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-ink-100 px-4 py-3 space-y-2">
          <Link to="/search" className="block py-1.5 text-sm text-ink-700">Find a Place</Link>
          {user ? (
            <>
              <Link to={roleHome[user.role] || "/"} className="block py-1.5 text-sm text-ink-700">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="block py-1.5 text-sm text-red-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block py-1.5 text-sm text-ink-700">Log in</Link>
              <Link to="/register" className="block py-1.5 text-sm text-brand-600">Sign up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
