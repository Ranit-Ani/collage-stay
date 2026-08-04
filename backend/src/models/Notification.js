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
