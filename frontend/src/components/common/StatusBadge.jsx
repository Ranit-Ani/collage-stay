import React from "react";

const STYLES = {
  Pending: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  Accepted: "bg-emerald-50 text-emerald-700",
  approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
  rejected: "bg-red-50 text-red-700",
  Cancelled: "bg-ink-100 text-ink-500",
};

const StatusBadge = ({ status }) => (
  <span className={`badge ${STYLES[status] || "bg-ink-100 text-ink-600"}`}>{status}</span>
);

export default StatusBadge;
