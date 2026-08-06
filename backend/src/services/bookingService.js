const BookingRequest = require("../models/BookingRequest");
const Property = require("../models/Property");
const Notification = require("../models/Notification");

// Statuses during which a seat is considered reserved against the property's
// occupiedSeats count (reserved at Accept-time, released on exit from this set
// into a terminal state, or on Completed after vacating).
const SEAT_HOLDING_STATUSES = ["Accepted", "Confirmed", "Move-in Pending", "Occupied", "Vacate Requested"];

// A student may cancel their own booking up through Confirmed. Once the
// move-in date arrives (Move-in Pending) or later, only the owner can cancel,
// or the student can request to vacate once Occupied.
const STUDENT_CANCELLABLE_STATUSES = ["Pending", "Accepted", "Confirmed"];
const OWNER_CANCELLABLE_STATUSES = ["Accepted", "Confirmed", "Move-in Pending"];

const paymentDeadline = () => {
  const hours = Number(process.env.PAYMENT_DEADLINE_HOURS) || 48;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

// Appends one entry to the booking's audit trail. Caller is still
// responsible for saving the document.
const addTimeline = (booking, status, note = "", actorId = null) => {
  booking.timeline.push({ status, note, at: new Date(), actor: actorId || undefined });
};

// Releases one reserved/occupied seat back to the property and broadcasts the
// updated availability, exactly like the existing accept-booking flow already
// did — reused here so every exit path (cancel, reject-after-accept, expiry,
// vacate-approve) keeps seat counts in sync automatically.
const releaseSeat = async (propertyOrId, io) => {
  const property = propertyOrId?.availability ? propertyOrId : await Property.findById(propertyOrId);
  if (!property) return null;

  property.availability.occupiedSeats = Math.max(0, property.availability.occupiedSeats - 1);
  await property.save();

  if (io) {
    io.emit("availabilityUpdated", {
      propertyId: property._id,
      totalSeats: property.availability.totalSeats,
      occupiedSeats: property.availability.occupiedSeats,
      availableSeats: property.availableSeats,
    });
  }
  return property;
};

const notify = async (io, { recipient, type, title, message, relatedProperty, relatedBooking }) => {
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    relatedProperty,
    relatedBooking,
  });
  io.to(recipient.toString()).emit("notificationReceived", notification);
  return notification;
};

// One unified, generic event any page can subscribe to for a live refresh,
// on top of whichever specific legacy events (bookingAccepted, etc.) the
// controller also emits for backward compatibility.
const broadcastBookingUpdate = (io, booking) => {
  io.to(booking.student.toString()).emit("bookingUpdated", { booking });
  io.to(booking.owner.toString()).emit("bookingUpdated", { booking });
};

// Runs on a timer (see server.js). Handles the two transitions that aren't
// triggered by a direct user action:
//   1. Accepted bookings whose payment deadline has passed without a
//      completed payment automatically Expire, freeing the reserved seat.
//   2. Confirmed bookings whose move-in date has arrived automatically move
//      to "Move-in Pending", prompting the owner to confirm the move-in.
const runPeriodicBookingChecks = async (io) => {
  const now = new Date();

  // 1. Expire unpaid, past-deadline bookings
  const expiring = await BookingRequest.find({
    status: "Accepted",
    isActive: true,
    "payment.deadline": { $lte: now },
    "payment.status": { $in: ["Pending", "Awaiting Verification", "Failed"] },
  }).populate("property");

  for (const booking of expiring) {
    booking.status = "Expired";
    booking.isActive = false;
    booking.expiredAt = now;
    addTimeline(booking, "Expired", "Payment deadline passed without a confirmed payment.");
    await booking.save();

    if (booking.property) await releaseSeat(booking.property, io);

    broadcastBookingUpdate(io, booking);
    await notify(io, {
      recipient: booking.student,
      type: "BOOKING_EXPIRED",
      title: "Booking expired",
      message: `Your booking for ${booking.property?.propertyName || "the property"} expired because the security deposit wasn't paid in time.`,
      relatedProperty: booking.property?._id,
      relatedBooking: booking._id,
    });
    await notify(io, {
      recipient: booking.owner,
      type: "BOOKING_EXPIRED",
      title: "Booking expired",
      message: `A booking for ${booking.property?.propertyName || "your property"} expired — the student didn't complete payment in time. The seat is available again.`,
      relatedProperty: booking.property?._id,
      relatedBooking: booking._id,
    });
  }

  // 2. Promote paid/confirmed bookings whose move-in date has arrived
  const arriving = await BookingRequest.find({
    status: "Confirmed",
    isActive: true,
    $or: [{ moveInDate: null }, { moveInDate: { $lte: now } }],
  }).populate("property");

  for (const booking of arriving) {
    booking.status = "Move-in Pending";
    addTimeline(booking, "Move-in Pending", "Move-in date has arrived — awaiting the owner to confirm move-in.");
    await booking.save();

    broadcastBookingUpdate(io, booking);
    await notify(io, {
      recipient: booking.owner,
      type: "MOVE_IN_PENDING",
      title: "Move-in confirmation needed",
      message: `${booking.property?.propertyName || "A booking"} is ready for move-in. Please confirm once the student has moved in.`,
      relatedProperty: booking.property?._id,
      relatedBooking: booking._id,
    });
  }

  return { expiredCount: expiring.length, movedToMoveInPending: arriving.length };
};

module.exports = {
  SEAT_HOLDING_STATUSES,
  STUDENT_CANCELLABLE_STATUSES,
  OWNER_CANCELLABLE_STATUSES,
  paymentDeadline,
  addTimeline,
  releaseSeat,
  notify,
  broadcastBookingUpdate,
  runPeriodicBookingChecks,
};
