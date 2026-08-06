import React, { useEffect, useState } from "react";
import { Heart, History, Search, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import StatCard from "../../components/common/StatCard";
import { studentApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [bRes, fRes] = await Promise.all([
      studentApi.getBookingHistory(),
      studentApi.getFavourites(),
    ]);
    setBookings(bRes.data.data.bookings);
    setFavourites(fRes.data.data.favourites);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Booking decisions update the overview cards instantly
  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on("bookingAccepted", refresh);
    socket.on("bookingRejected", refresh);
    socket.on("bookingCreated", refresh);
    socket.on("bookingCancelled", refresh);
    socket.on("bookingUpdated", refresh);
    return () => {
      socket.off("bookingAccepted", refresh);
      socket.off("bookingRejected", refresh);
      socket.off("bookingCreated", refresh);
      socket.off("bookingCancelled", refresh);
      socket.off("bookingUpdated", refresh);
    };
  }, [socket]);

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  const actionNeededCount = bookings.filter(
    (b) => b.status === "Pending" || (b.status === "Accepted" && b.payment?.status !== "Awaiting Verification")
  ).length;

  return (
    <DashboardLayout>
      <h1 className="page-heading">Welcome back, {user?.fullName?.split(" ")[0]}</h1>
      <p className="page-subheading mb-6">Here's what's happening with your accommodation search.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link to="/student/bookings">
          <StatCard icon={Clock} label="Needs Your Action" value={actionNeededCount} tone="amber" />
        </Link>
        <StatCard icon={History} label="Total Bookings" value={bookings.length} />
        <StatCard icon={Heart} label="Saved Favourites" value={favourites.length} tone="accent" />
      </div>

      <p className="section-title">Quick Actions</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/search" className="card p-5 hover:shadow-card hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <Search className="h-4 w-4 text-brand-600" />
          </div>
          <span className="text-sm font-medium text-ink-800">Search Properties</span>
        </Link>
        <Link to="/student/favourites" className="card p-5 hover:shadow-card hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <Heart className="h-4 w-4 text-brand-600" />
          </div>
          <span className="text-sm font-medium text-ink-800">View Favourites</span>
        </Link>
        <Link to="/student/bookings" className="card p-5 hover:shadow-card hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center">
            <History className="h-4 w-4 text-brand-600" />
          </div>
          <span className="text-sm font-medium text-ink-800">Booking History</span>
        </Link>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
