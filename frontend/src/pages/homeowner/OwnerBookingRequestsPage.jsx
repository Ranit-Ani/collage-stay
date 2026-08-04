import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { bookingApi } from "../../api/endpoints";
import { useSocket } from "../../context/SocketContext";

const TABS = ["Pending", "Accepted", "Rejected", "Cancelled"];

const OwnerBookingRequestsPage = () => {
  const { socket } = useSocket();
  const [tab, setTab] = useState("Pending");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (status) => {
    setLoading(true);
    const { data } = await bookingApi.getOwnerRequests(status);
    setBookings(data.data.bookings);
    setLoading(false);
  };

  useEffect(() => { load(tab); }, [tab]);

  // New requests appear instantly without a page refresh
  useEffect(() => {
    if (!socket) return;
    const refresh = () => load(tab);
    socket.on("bookingRequested", refresh);
    return () => socket.off("bookingRequested", refresh);
  }, [socket, tab]);

  const handleAccept = async (id) => {
    try {
      await bookingApi.accept(id);
      toast.success("Booking accepted");
      load(tab);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await bookingApi.reject(id);
      toast.success("Booking rejected");
      load(tab);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <DashboardLayout>
      <h1 className="page-heading mb-4">Booking Requests</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`badge border shrink-0 ${
              tab === t ? "bg-brand-600 text-white border-brand-600" : "bg-white text-ink-600 border-ink-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : bookings.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">No {tab.toLowerCase()} requests.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b._id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {b.student?.profilePicture?.url ? (
                  <img src={b.student.profilePicture.url} alt="" className="h-12 w-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-ink-100 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-ink-900 truncate">{b.student?.fullName}</p>
                  <p className="text-xs text-ink-500 truncate">{b.student?.email} · {b.student?.phone}</p>
                  <p className="text-xs text-ink-500 mt-1 truncate">For: {b.property?.propertyName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <StatusBadge status={b.status} />
                {b.status === "Pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(b._id)} className="btn-primary !py-1.5 !px-3 text-xs">
                      Accept
                    </button>
                    <button onClick={() => handleReject(b._id)} className="btn-danger !py-1.5 !px-3 text-xs">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default OwnerBookingRequestsPage;
