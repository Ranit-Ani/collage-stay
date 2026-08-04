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

// Prevent a student from spamming duplicate pending requests on the same property
bookingRequestSchema.index(
  { student: 1, property: 1, status: 1 },
  { unique: false }
);

module.exports = mongoose.model("BookingRequest", bookingRequestSchema);
