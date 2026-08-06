import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp } from "lucide-react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import BookingTimeline from "../../components/booking/BookingTimeline";
import ReasonPromptModal from "../../components/booking/ReasonPromptModal";
import PaymentModal from "../../components/booking/PaymentModal";
import { studentApi, bookingApi } from "../../api/endpoints";
import { useSocket } from "../../context/SocketContext";

const TABS = ["All", "Needs Action", "Active", "Completed", "Closed"];

const ACTIVE = ["Pending", "Accepted", "Confirmed", "Move-in Pending", "Occupied", "Vacate Requested"];
const CLOSED = ["Rejected", "Cancelled by Student", "Cancelled by Owner", "Expired"];

const matchesTab = (b, tab) => {
  if (tab === "All") return true;
  if (tab === "Needs Action") return b.status === "Accepted" && b.payment?.status !== "Paid" && b.payment?.status !== "Awaiting Verification";
  if (tab === "Active") return ACTIVE.includes(b.status);
  if (tab === "Completed") return b.status === "Completed";
  if (tab === "Closed") return CLOSED.includes(b.status);
  return true;
};

const formatDate = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "");

const BookingHistoryPage = () => {
  const { socket } = useSocket();
  const [tab, setTab] = useState("All");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(() => new Set());
  const [prompt, setPrompt] = useState(null); // { bookingId, kind } | null
  const [payingBooking, setPayingBooking] = useState(null);

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
    socket.on("bookingUpdated", refresh);
    return () => {
      socket.off("bookingAccepted", refresh);
      socket.off("bookingRejected", refresh);
      socket.off("bookingCreated", refresh);
      socket.off("bookingCancelled", refresh);
      socket.off("bookingUpdated", refresh);
    };
  }, [socket]);

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const runAction = async (fn, successMsg) => {
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handlePromptConfirm = async (reason) => {
    const { bookingId, kind } = prompt;
    const actions = {
      cancel: () => bookingApi.cancel(bookingId, reason),
      vacate: () => bookingApi.requestVacate(bookingId, reason),
    };
    const messages = {
      cancel: "Booking cancelled",
      vacate: "Vacate request sent to the owner",
    };
    await runAction(actions[kind], messages[kind]);
    setPrompt(null);
  };

  const promptConfig = {
    cancel: { title: "Cancel Booking", label: "Reason (optional)", required: false, confirmLabel: "Cancel Booking" },
    vacate: { title: "Request to Vacate", label: "Reason (optional)", required: false, confirmLabel: "Send Request", danger: false },
  }[prompt?.kind] || {};

  const filtered = bookings.filter((b) => matchesTab(b, tab));

  const renderStatusInfo = (b) => {
    switch (b.status) {
      case "Accepted":
        if (b.payment?.status === "Awaiting Verification") {
          return <p className="text-xs text-ink-500">Your offline payment is awaiting owner verification.</p>;
        }
        if (b.payment?.status === "Failed") {
          return <p className="text-xs text-red-600">{b.payment.rejectionReason || "Payment failed"} — please retry.</p>;
        }
        return b.payment?.deadline ? (
          <p className="text-xs text-amber-700">Pay before {formatDate(b.payment.deadline)}</p>
        ) : null;
      case "Confirmed":
        return <p className="text-xs text-emerald-700">Deposit confirmed — awaiting move-in.</p>;
      case "Move-in Pending":
        return <p className="text-xs text-amber-700">Move-in date has arrived — owner will confirm shortly.</p>;
      case "Occupied":
        return <p className="text-xs text-indigo-700">You're checked in.</p>;
      case "Vacate Requested":
        return <p className="text-xs text-orange-700">Vacate request sent — awaiting owner approval.</p>;
      case "Rejected":
        return null;
      case "Cancelled by Owner":
        return b.cancellation?.reason ? <p className="text-xs text-ink-500">Reason: {b.cancellation.reason}</p> : null;
      default:
        return null;
    }
  };

  const renderActions = (b) => {
    const buttons = [];

    if (b.status === "Accepted" && b.payment?.status !== "Awaiting Verification" && b.payment?.required) {
      buttons.push(
        <button key="pay" onClick={() => setPayingBooking(b)} className="btn-primary !py-1.5 !px-3 text-xs">
          Pay Deposit
        </button>
      );
    }

    if (["Pending", "Accepted", "Confirmed"].includes(b.status)) {
      buttons.push(
        <button key="cancel" onClick={() => setPrompt({ bookingId: b._id, kind: "cancel" })} className="text-xs text-red-600 font-medium">
          Cancel Request
        </button>
      );
    }

    if (b.status === "Occupied") {
      buttons.push(
        <button key="vacate" onClick={() => setPrompt({ bookingId: b._id, kind: "vacate" })} className="btn-secondary !py-1.5 !px-3 text-xs">
          Request to Vacate
        </button>
      );
    }

    if (!buttons.length) return null;
    return <div className="flex items-center gap-3">{buttons}</div>;
  };

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="page-heading mb-4">Booking History</h1>

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

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">
          {bookings.length === 0 ? "You haven't made any booking requests yet." : "No bookings in this view."}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div key={b._id} className="card p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                    {renderStatusInfo(b)}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={b.status} />
                    {b.payment?.required && b.payment.status !== "Not Required" && (
                      <StatusBadge status={b.payment.status} />
                    )}
                  </div>
                  {renderActions(b)}
                </div>
              </div>

              <button
                onClick={() => toggleExpanded(b._id)}
                className="mt-3 flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600"
              >
                {expanded.has(b._id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {expanded.has(b._id) ? "Hide timeline" : "View timeline"}
              </button>
              {expanded.has(b._id) && <BookingTimeline timeline={b.timeline} />}
            </div>
          ))}
        </div>
      )}

      <ReasonPromptModal
        open={!!prompt}
        onClose={() => setPrompt(null)}
        onConfirm={handlePromptConfirm}
        title={promptConfig.title}
        label={promptConfig.label}
        required={promptConfig.required}
        confirmLabel={promptConfig.confirmLabel}
        danger={promptConfig.danger !== false}
      />

      <PaymentModal
        booking={payingBooking}
        open={!!payingBooking}
        onClose={() => setPayingBooking(null)}
        onUpdated={() => load()}
      />
    </DashboardLayout>
  );
};

export default BookingHistoryPage;
