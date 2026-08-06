const mongoose = require("mongoose");

/**
 * Booking lifecycle (see services/bookingService.js for the transition rules):
 *
 *   Pending -> Accepted -> Confirmed -> Move-in Pending -> Occupied
 *            -> Vacate Requested -> Completed
 *
 * Side branches: Rejected, Cancelled by Student, Cancelled by Owner, Expired.
 */
const BOOKING_STATUSES = [
  "Pending",
  "Accepted",
  "Confirmed",
  "Move-in Pending",
  "Occupied",
  "Vacate Requested",
  "Completed",
  "Rejected",
  "Cancelled by Student",
  "Cancelled by Owner",
  "Expired",
];

const PAYMENT_STATUSES = ["Not Required", "Pending", "Awaiting Verification", "Paid", "Failed"];

const bookingRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "Pending",
    },

    // Cleared to false the moment a booking reaches any terminal status. This
    // (rather than an $in over several statuses) is what the uniqueness index
    // below relies on, since Mongo partial indexes can't filter on $in.
    isActive: { type: Boolean, default: true },

    message: { type: String, default: "" },
    moveInDate: { type: Date },

    respondedAt: { type: Date }, // when the owner accepted/rejected the initial request

    // ---------- Security deposit payment ----------
    payment: {
      required: { type: Boolean, default: true },
      amount: { type: Number, default: 0 },
      method: { type: String, enum: ["Online", "Offline", null], default: null },
      status: { type: String, enum: PAYMENT_STATUSES, default: "Not Required" },
      transactionId: { type: String, default: "" },
      offlineNote: { type: String, default: "" },
      rejectionReason: { type: String, default: "" },
      attempts: { type: Number, default: 0 },
      paidAt: { type: Date },
      verifiedAt: { type: Date },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deadline: { type: Date },
    },

    // ---------- Move-in ----------
    moveIn: {
      confirmedAt: { type: Date },
      confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    // ---------- Vacate ----------
    vacate: {
      requestedAt: { type: Date },
      reason: { type: String, default: "" },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      rejectionReason: { type: String, default: "" },
    },

    completedAt: { type: Date },
    expiredAt: { type: Date },

    cancellation: {
      cancelledBy: { type: String, enum: ["student", "owner", null], default: null },
      reason: { type: String, default: "" },
      cancelledAt: { type: Date },
    },

    // Full audit trail of every status change, shown to both sides as the
    // "Booking Timeline".
    timeline: [
      {
        status: { type: String, required: true },
        note: { type: String, default: "" },
        at: { type: Date, default: Date.now },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

// Enforces "at most one active request per student per property" at the
// database level, across the whole active lifecycle (not just Pending).
bookingRequestSchema.index(
  { student: 1, property: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

// Used by the periodic auto-expiry / auto move-in-pending checks.
bookingRequestSchema.index({ status: 1, "payment.deadline": 1 });
bookingRequestSchema.index({ status: 1, moveInDate: 1 });

bookingRequestSchema.set("toJSON", { virtuals: true });
bookingRequestSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("BookingRequest", bookingRequestSchema);
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
