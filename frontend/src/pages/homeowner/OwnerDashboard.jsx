import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ClipboardList, PlusCircle } from "lucide-react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
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
    return () => {
      socket.off("bookingRequested", refresh);
      socket.off("availabilityUpdated", refresh);
    };
  }, [socket]);

  if (!stats) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold text-ink-900 mb-6">Owner Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-ink-500 mb-1">Total Properties</p>
          <p className="text-2xl font-semibold text-ink-900">{stats.totalProperties}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-500 mb-1">Approved</p>
          <p className="text-2xl font-semibold text-ink-900">{stats.approvedProperties}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-500 mb-1">Pending Requests</p>
          <p className="text-2xl font-semibold text-ink-900">{stats.pendingRequests}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-500 mb-1">Available Seats</p>
          <p className="text-2xl font-semibold text-ink-900">{stats.availableSeats}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/owner/properties/new" className="card p-5 hover:shadow-card transition-shadow flex items-center gap-3">
          <PlusCircle className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-medium text-ink-800">Add Property</span>
        </Link>
        <Link to="/owner/properties" className="card p-5 hover:shadow-card transition-shadow flex items-center gap-3">
          <Building2 className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-medium text-ink-800">My Properties</span>
        </Link>
        <Link to="/owner/bookings" className="card p-5 hover:shadow-card transition-shadow flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-medium text-ink-800">Booking Requests</span>
        </Link>
      </div>
    </DashboardLayout>
  );
};

export default OwnerDashboard;
