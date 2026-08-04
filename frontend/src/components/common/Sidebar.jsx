import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Heart,
  History,
  UserCircle,
  Building2,
  PlusCircle,
  ClipboardList,
  Users,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";

const linksByRole = {
  student: [
    { to: "/student/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/search", label: "Search Properties", icon: Search },
    { to: "/student/favourites", label: "Favourites", icon: Heart },
    { to: "/student/bookings", label: "Booking History", icon: History },
    { to: "/student/profile", label: "Profile", icon: UserCircle },
  ],
  homeowner: [
    { to: "/owner/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/owner/properties", label: "My Properties", icon: Building2 },
    { to: "/owner/properties/new", label: "Add Property", icon: PlusCircle },
    { to: "/owner/bookings", label: "Booking Requests", icon: ClipboardList },
    { to: "/owner/profile", label: "Profile", icon: UserCircle },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/students", label: "Students", icon: Users },
    { to: "/admin/home-owners", label: "Home Owners", icon: Users },
    { to: "/admin/listings", label: "Manage Listings", icon: ShieldCheck },
    { to: "/admin/reviews", label: "Manage Reviews", icon: Star },
  ],
};

const Sidebar = ({ role, isOpen = false, onClose = () => {} }) => {
  const links = linksByRole[role] || [];
  const roleLabel = { student: "Student", homeowner: "Home Owner", admin: "Admin" }[role];

  const content = (
    <>
      <div className="flex items-center justify-between mb-3 lg:block">
        {roleLabel && (
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            {roleLabel} Menu
          </p>
        )}
        {/* Close button only makes sense inside the mobile drawer */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-ink-400 hover:text-ink-700"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-600" />}
                <Icon className="h-4 w-4" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop: static sidebar, always visible */}
      <aside className="w-64 shrink-0 hidden lg:block border-r border-ink-100 bg-white min-h-[calc(100vh-4rem)] py-6 px-4">
        {content}
      </aside>

      {/* Mobile/tablet: off-canvas drawer, toggled via the hamburger in DashboardLayout */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-ink-900/40"
          onClick={onClose}
          aria-hidden="true"
        />
        <aside
          className={`absolute top-0 left-0 h-full w-64 bg-white py-6 px-4 shadow-xl transition-transform duration-200 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {content}
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
