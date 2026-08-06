import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp } from "lucide-react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import BookingTimeline from "../../components/booking/BookingTimeline";
import ReasonPromptModal from "../../components/booking/ReasonPromptModal";
import { bookingApi } from "../../api/endpoints";
import { useSocket } from "../../context/SocketContext";

const TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "Pending" },
  { label: "Accepted", value: "Accepted" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Move-in Pending", value: "Move-in Pending" },
  { label: "Occupied", value: "Occupied" },
  { label: "Vacate Requested", value: "Vacate Requested" },
  { label: "Completed", value: "Completed" },
  { label: "Closed", value: "Rejected,Cancelled by Student,Cancelled by Owner,Expired" },
];

const formatDate = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "");

const OwnerBookingRequestsPage = () => {
  const { socket } = useSocket();
  const [tab, setTab] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(() => new Set());

  // Which reason-prompt modal is currently open, and what it should do on confirm
  const [prompt, setPrompt] = useState(null); // { bookingId, kind } | null

  const load = async (status) => {
    setLoading(true);
    try {
      const { data } = await bookingApi.getOwnerRequests(status || undefined);
      setBookings(data.data.bookings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(tab); }, [tab]);

  // Live updates without needing to refresh
  useEffect(() => {
    if (!socket) return;
    const refresh = () => load(tab);
    socket.on("bookingRequested", refresh);
    socket.on("bookingUpdated", refresh);
    return () => {
      socket.off("bookingRequested", refresh);
      socket.off("bookingUpdated", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, tab]);

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
      load(tab);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleAccept = (id) => runAction(() => bookingApi.accept(id), "Booking accepted");
  const handleApprovePayment = (id) =>
    runAction(() => bookingApi.verifyOfflinePayment(id, { approve: true }), "Payment verified — booking confirmed");
  const handleConfirmMoveIn = (id) => runAction(() => bookingApi.confirmMoveIn(id), "Move-in confirmed");
  const handleApproveVacate = (id) => runAction(() => bookingApi.approveVacate(id), "Vacate approved — booking completed");

  const handlePromptConfirm = async (reason) => {
    const { bookingId, kind } = prompt;
    const actions = {
      reject: () => bookingApi.reject(bookingId, reason),
      cancel: () => bookingApi.cancelByOwner(bookingId, reason),
      rejectPayment: () => bookingApi.verifyOfflinePayment(bookingId, { approve: false, reason }),
      rejectVacate: () => bookingApi.rejectVacate(bookingId, reason),
    };
    const messages = {
      reject: "Booking request rejected",
      cancel: "Booking cancelled",
      rejectPayment: "Payment rejected — student can resubmit",
      rejectVacate: "Vacate request declined",
    };
    await runAction(actions[kind], messages[kind]);
    setPrompt(null);
  };

  const promptConfig = {
    reject: { title: "Reject Booking Request", label: "Reason for rejection", required: false, confirmLabel: "Reject Request" },
    cancel: { title: "Cancel Booking", label: "Reason for cancellation", required: true, confirmLabel: "Cancel Booking" },
    rejectPayment: { title: "Reject Payment Proof", label: "Why couldn't this be verified?", required: false, confirmLabel: "Reject Payment" },
    rejectVacate: { title: "Decline Vacate Request", label: "Reason for declining", required: false, confirmLabel: "Decline Request" },
  }[prompt?.kind] || {};

  const renderActions = (b) => {
    switch (b.status) {
      case "Pending":
        return (
          <div className="flex gap-2">
            <button onClick={() => handleAccept(b._id)} className="btn-primary !py-1.5 !px-3 text-xs">Accept</button>
            <button onClick={() => setPrompt({ bookingId: b._id, kind: "reject" })} className="btn-danger !py-1.5 !px-3 text-xs">Reject</button>
          </div>
        );
      case "Accepted":
        if (b.payment?.status === "Awaiting Verification") {
          return (
            <div className="flex gap-2">
              <button onClick={() => handleApprovePayment(b._id)} className="btn-primary !py-1.5 !px-3 text-xs">Approve Payment</button>
              <button onClick={() => setPrompt({ bookingId: b._id, kind: "rejectPayment" })} className="btn-danger !py-1.5 !px-3 text-xs">Reject Payment</button>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-ink-500">Awaiting deposit payment{b.payment?.deadline ? ` · due ${formatDate(b.payment.deadline)}` : ""}</p>
            <button onClick={() => setPrompt({ bookingId: b._id, kind: "cancel" })} className="text-xs text-red-600 font-medium">Cancel Booking</button>
          </div>
        );
      case "Confirmed":
      case "Move-in Pending":
        return (
          <div className="flex gap-2">
            <button onClick={() => handleConfirmMoveIn(b._id)} className="btn-primary !py-1.5 !px-3 text-xs">Confirm Move-in</button>
            <button onClick={() => setPrompt({ bookingId: b._id, kind: "cancel" })} className="btn-danger !py-1.5 !px-3 text-xs">Cancel</button>
          </div>
        );
      case "Vacate Requested":
        return (
          <div className="flex gap-2">
            <button onClick={() => handleApproveVacate(b._id)} className="btn-primary !py-1.5 !px-3 text-xs">Approve Vacate</button>
            <button onClick={() => setPrompt({ bookingId: b._id, kind: "rejectVacate" })} className="btn-danger !py-1.5 !px-3 text-xs">Decline</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <h1 className="page-heading mb-4">Booking Requests</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-thin pb-1">
        {TABS.map((t) => (
          <button
            key={t.label}
            onClick={() => setTab(t.value)}
            className={`badge border shrink-0 ${
              tab === t.value ? "bg-brand-600 text-white border-brand-600" : "bg-white text-ink-600 border-ink-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : bookings.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">No requests here yet.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b._id} className="card p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
      />
    </DashboardLayout>
  );
};

export default OwnerBookingRequestsPage;
