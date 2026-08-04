import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import { adminApi } from "../../api/endpoints";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.getDashboardStats().then(({ data }) => setStats(data.data));
  }, []);

  if (!stats) return <DashboardLayout><Loader /></DashboardLayout>;

  const cards = [
    { label: "Total Students", value: stats.totalStudents },
    { label: "Total Home Owners", value: stats.totalHomeOwners },
    { label: "Total Properties", value: stats.totalProperties },
    { label: "Pending Approvals", value: stats.pendingProperties },
    { label: "Approved Listings", value: stats.approvedProperties },
    { label: "Total Bookings", value: stats.totalBookings },
    { label: "Total Reviews", value: stats.totalReviews },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold text-ink-900 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-xs text-ink-500 mb-1">{c.label}</p>
            <p className="text-2xl font-semibold text-ink-900">{c.value}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
