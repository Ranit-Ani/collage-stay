import React from "react";

const STYLES = {
  Pending: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  Accepted: "bg-sky-50 text-sky-700",
  Confirmed: "bg-emerald-50 text-emerald-700",
  approved: "bg-emerald-50 text-emerald-700",
  "Move-in Pending": "bg-amber-50 text-amber-700",
  Occupied: "bg-indigo-50 text-indigo-700",
  "Vacate Requested": "bg-orange-50 text-orange-700",
  Completed: "bg-ink-100 text-ink-600",
  Rejected: "bg-red-50 text-red-700",
  rejected: "bg-red-50 text-red-700",
  Cancelled: "bg-ink-100 text-ink-500",
  "Cancelled by Student": "bg-ink-100 text-ink-500",
  "Cancelled by Owner": "bg-ink-100 text-ink-500",
  Expired: "bg-red-50 text-red-500",

  // Payment statuses reuse the same badge
  "Not Required": "bg-ink-100 text-ink-500",
  "Awaiting Verification": "bg-amber-50 text-amber-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Failed: "bg-red-50 text-red-700",
};

const StatusBadge = ({ status }) => (
  <span className={`badge ${STYLES[status] || "bg-ink-100 text-ink-600"}`}>{status}</span>
);

export default StatusBadge;
