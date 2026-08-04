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

const Sidebar = ({ role }) => {
  const links = linksByRole[role] || [];

  return (
    <aside className="w-60 shrink-0 hidden lg:block border-r border-ink-100 bg-white min-h-[calc(100vh-4rem)] py-6 px-3">
      <nav className="space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
