import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { studentApi, bookingApi } from "../../api/endpoints";
import { useSocket } from "../../context/SocketContext";

const BookingHistoryPage = () => {
  const { socket } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await studentApi.getBookingHistory();
    setBookings(data.data.bookings);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Live status updates without needing to refresh
  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on("bookingAccepted", refresh);
    socket.on("bookingRejected", refresh);
    socket.on("bookingCreated", refresh);
    socket.on("bookingCancelled", refresh);
    return () => {
      socket.off("bookingAccepted", refresh);
      socket.off("bookingRejected", refresh);
      socket.off("bookingCreated", refresh);
      socket.off("bookingCancelled", refresh);
    };
  }, [socket]);

  const handleCancel = async (id) => {
    try {
      await bookingApi.cancel(id);
      toast.success("Booking request cancelled.");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancel failed");
    }
  };

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="page-heading mb-6">Booking History</h1>

      {bookings.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">You haven't made any booking requests yet.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b._id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <img
                  src={b.property?.images?.[0]?.url || "https://placehold.co/80x80"}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium text-ink-900 truncate">{b.property?.propertyName}</p>
                  <p className="text-xs text-ink-500 truncate">{b.property?.address?.area}, {b.property?.address?.city}</p>
                  <p className="text-xs text-ink-500 mt-1 truncate">Owner: {b.owner?.fullName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                <StatusBadge status={b.status} />
                {b.status === "Pending" && (
                  <button onClick={() => handleCancel(b._id)} className="text-xs text-red-600 font-medium">
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default BookingHistoryPage;
