const mongoose = require("mongoose");

const bookingRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Cancelled"],
      default: "Pending",
    },

    message: { type: String, default: "" },
    moveInDate: { type: Date },

    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// Enforces "at most one active request per student per property" at the database
// level — this is the real guard against duplicate bookings, since it holds even
// if two requests race each other (e.g. a fast double-click) and both pass an
// earlier application-level check before either has saved. Two separate partial
// indexes are used because MongoDB partial indexes don't support $in filters.
bookingRequestSchema.index(
  { student: 1, property: 1 },
  { unique: true, partialFilterExpression: { status: "Pending" } }
);
bookingRequestSchema.index(
  { student: 1, property: 1 },
  { unique: true, partialFilterExpression: { status: "Accepted" } }
);

module.exports = mongoose.model("BookingRequest", bookingRequestSchema);
