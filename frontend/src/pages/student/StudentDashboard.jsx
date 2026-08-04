import React, { useEffect, useState } from "react";
import { Heart, History, Search } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import { studentApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [bRes, fRes] = await Promise.all([
        studentApi.getBookingHistory(),
        studentApi.getFavourites(),
      ]);
      setBookings(bRes.data.data.bookings);
      setFavourites(fRes.data.data.favourites);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  const pendingCount = bookings.filter((b) => b.status === "Pending").length;

  return (
    <DashboardLayout>
      <h1 className="text-xl font-semibold text-ink-900 mb-1">Welcome back, {user?.fullName?.split(" ")[0]}</h1>
      <p className="text-sm text-ink-500 mb-6">Here's what's happening with your accommodation search.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-ink-500 mb-1">Pending Requests</p>
          <p className="text-2xl font-semibold text-ink-900">{pendingCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-500 mb-1">Total Bookings</p>
          <p className="text-2xl font-semibold text-ink-900">{bookings.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-500 mb-1">Saved Favourites</p>
          <p className="text-2xl font-semibold text-ink-900">{favourites.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/search" className="card p-5 hover:shadow-card transition-shadow flex items-center gap-3">
          <Search className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-medium text-ink-800">Search Properties</span>
        </Link>
        <Link to="/student/favourites" className="card p-5 hover:shadow-card transition-shadow flex items-center gap-3">
          <Heart className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-medium text-ink-800">View Favourites</span>
        </Link>
        <Link to="/student/bookings" className="card p-5 hover:shadow-card transition-shadow flex items-center gap-3">
          <History className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-medium text-ink-800">Booking History</span>
        </Link>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
