import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ClipboardList, PlusCircle, Home, CheckCircle2, Users } from "lucide-react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import StatCard from "../../components/common/StatCard";
import { homeOwnerApi } from "../../api/endpoints";
import { useSocket } from "../../context/SocketContext";

const OwnerDashboard = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);

  const load = async () => {
    const { data } = await homeOwnerApi.getDashboardStats();
    setStats(data.data);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on("bookingRequested", refresh);
    socket.on("availabilityUpdated", refresh);
    socket.on("propertyApproved", refresh);
    socket.on("propertyRejected", refresh);
    return () => {
      socket.off("bookingRequested", refresh);
      socket.off("availabilityUpdated", refresh);
      socket.off("propertyApproved", refresh);
      socket.off("propertyRejected", refresh);
    };
  }, [socket]);

  if (!stats) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="page-heading mb-6">Owner Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Home} label="Total Properties" value={stats.totalProperties} />
        <StatCard icon={CheckCircle2} label="Approved" value={stats.approvedProperties} tone="accent" />
        <StatCard icon={ClipboardList} label="Pending Requests" value={stats.pendingRequests} tone="amber" />
        <StatCard icon={Users} label="Available Seats" value={stats.availableSeats} />
      </div>

      <p className="section-title">Quick Actions</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/owner/properties/new" className="card p-5 hover:shadow-card hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <PlusCircle className="h-4 w-4 text-brand-600" />
          </div>
          <span className="text-sm font-medium text-ink-800">Add Property</span>
        </Link>
        <Link to="/owner/properties" className="card p-5 hover:shadow-card hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-brand-600" />
          </div>
          <span className="text-sm font-medium text-ink-800">My Properties</span>
        </Link>
        <Link to="/owner/bookings" className="card p-5 hover:shadow-card hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <ClipboardList className="h-4 w-4 text-brand-600" />
          </div>
          <span className="text-sm font-medium text-ink-800">Booking Requests</span>
        </Link>
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboard;
