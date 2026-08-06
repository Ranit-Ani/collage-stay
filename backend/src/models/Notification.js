const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "BOOKING_REQUEST_RECEIVED",
        "BOOKING_ACCEPTED",
        "BOOKING_REJECTED",
        "BOOKING_CANCELLED",
        "BOOKING_CANCELLED_BY_STUDENT",
        "BOOKING_CANCELLED_BY_OWNER",
        "PAYMENT_SUBMITTED",
        "PAYMENT_VERIFIED",
        "PAYMENT_REJECTED",
        "PAYMENT_FAILED",
        "BOOKING_CONFIRMED",
        "MOVE_IN_PENDING",
        "MOVE_IN_CONFIRMED",
        "VACATE_REQUESTED",
        "VACATE_APPROVED",
        "VACATE_REJECTED",
        "BOOKING_COMPLETED",
        "BOOKING_EXPIRED",
        "PROPERTY_APPROVED",
        "PROPERTY_REJECTED",
        "NEW_REVIEW",
        "GENERAL",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedProperty: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: "BookingRequest" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
