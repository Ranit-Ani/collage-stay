import React, { useEffect, useState } from "react";
import { Users, Building2, Clock, CheckCircle2, ClipboardList, Star, UserCog } from "lucide-react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import StatCard from "../../components/common/StatCard";
import { adminApi } from "../../api/endpoints";
import { useSocket } from "../../context/SocketContext";

const AdminDashboard = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);

  const load = () => adminApi.getDashboardStats().then(({ data }) => setStats(data.data));

  useEffect(() => { load(); }, []);

  // Keep the overview numbers live instead of requiring a manual refresh
  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    const events = [
      "propertySubmitted", "propertyApproved", "propertyRejected", "propertyDeleted",
      "newUserRegistered", "userDeleted", "reviewAdded", "reviewDeleted",
      "bookingRequested", "bookingAccepted", "bookingRejected",
    ];
    events.forEach((ev) => socket.on(ev, refresh));
    return () => events.forEach((ev) => socket.off(ev, refresh));
  }, [socket]);

  if (!stats) return <DashboardLayout><Loader /></DashboardLayout>;

  const cards = [
    { icon: Users, label: "Total Students", value: stats.totalStudents },
    { icon: UserCog, label: "Total Home Owners", value: stats.totalHomeOwners },
    { icon: Building2, label: "Total Properties", value: stats.totalProperties },
    { icon: Clock, label: "Pending Approvals", value: stats.pendingProperties, tone: "amber" },
    { icon: CheckCircle2, label: "Approved Listings", value: stats.approvedProperties, tone: "accent" },
    { icon: ClipboardList, label: "Total Bookings", value: stats.totalBookings },
    { icon: Star, label: "Total Reviews", value: stats.totalReviews },
  ];

  return (
    <DashboardLayout>
      <h1 className="page-heading mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.label} icon={c.icon} label={c.label} value={c.value} tone={c.tone} />
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
