const BookingRequest = require("../models/BookingRequest");
const Property = require("../models/Property");
const asyncHandler = require("../middlewares/asyncHandler");
const { AppError } = require("../middlewares/errorMiddleware");
const { sendSuccess } = require("../utils/apiResponse");
const paymentService = require("../services/paymentService");
const {
  STUDENT_CANCELLABLE_STATUSES,
  OWNER_CANCELLABLE_STATUSES,
  paymentDeadline,
  addTimeline,
  releaseSeat,
  notify,
  broadcastBookingUpdate,
} = require("../services/bookingService");

const POPULATE_STUDENT = "fullName email phone profilePicture collegeName";
const POPULATE_PROPERTY = "propertyName propertyType images pricing address owner";
const POPULATE_OWNER = "fullName email phone businessName";

// @desc    Student sends a booking request to a home owner
// @route   POST /api/bookings
// @access  Private (student)
const createBookingRequest = asyncHandler(async (req, res) => {
  const { propertyId, message, moveInDate } = req.body;

  const property = await Property.findById(propertyId);
  if (!property || property.status !== "approved") {
    throw new AppError("Property not found or not available for booking.", 404);
  }
  if (property.availableSeats <= 0) {
    throw new AppError("No seats available for this property.", 400);
  }

  const existingActive = await BookingRequest.findOne({
    student: req.user._id,
    property: propertyId,
    isActive: true,
  });
  if (existingActive) {
    throw new AppError("You already have an active booking request for this property.", 409);
  }

  let booking;
  try {
    booking = await BookingRequest.create({
      student: req.user._id,
      property: propertyId,
      owner: property.owner,
      message,
      moveInDate,
      timeline: [{ status: "Pending", note: "Booking request sent to the home owner.", at: new Date() }],
    });
  } catch (err) {
    // Belt-and-suspenders: if two requests race each other and both pass the
    // check above, the database's unique partial index rejects the second one.
    if (err.code === 11000) {
      throw new AppError("You already have an active request for this property.", 409);
    }
    throw err;
  }

  const io = req.app.get("io");
  io.to(property.owner.toString()).emit("bookingRequested", { booking });
  io.to(req.user._id.toString()).emit("bookingCreated", { booking }); // refresh the student's own other tabs

  await notify(io, {
    recipient: property.owner,
    type: "BOOKING_REQUEST_RECEIVED",
    title: "New booking request",
    message: `${req.user.fullName} sent a booking request for ${property.propertyName}.`,
    relatedProperty: property._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 201, "Booking request sent successfully.", { booking });
});

// @desc    Student cancels their own booking before move-in
// @route   PATCH /api/bookings/:id/cancel
// @access  Private (student - own booking)
const cancelBookingRequest = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id).populate("property");
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.student.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to cancel this request.", 403);
  }
  if (!STUDENT_CANCELLABLE_STATUSES.includes(booking.status)) {
    throw new AppError(
      `A booking cannot be cancelled once it reaches "${booking.status}". Use the vacate request instead if you've already moved in.`,
      400
    );
  }

  const hadReservedSeat = booking.status !== "Pending";
  const wasPaid = booking.payment.status === "Paid";

  booking.status = "Cancelled by Student";
  booking.isActive = false;
  booking.cancellation = {
    cancelledBy: "student",
    reason: req.body.reason || "",
    cancelledAt: new Date(),
  };
  addTimeline(
    booking,
    "Cancelled by Student",
    wasPaid
      ? "Cancelled by the student. Any refund of the paid deposit is handled by the owner/admin."
      : "Cancelled by the student."
  );
  await booking.save();

  const io = req.app.get("io");
  if (hadReservedSeat && booking.property) await releaseSeat(booking.property, io);

  io.to(booking.owner.toString()).emit("bookingRequested", { booking }); // refresh owner's list
  io.to(booking.student.toString()).emit("bookingCancelled", { booking });
  broadcastBookingUpdate(io, booking);

  await notify(io, {
    recipient: booking.owner,
    type: "BOOKING_CANCELLED_BY_STUDENT",
    title: "Booking cancelled",
    message: `${req.user.fullName} cancelled their booking for ${booking.property?.propertyName || "your property"}.`,
    relatedProperty: booking.property?._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 200, "Booking request cancelled.", { booking });
});

// @desc    Owner cancels a booking after acceptance (before move-in)
// @route   PATCH /api/bookings/:id/cancel-by-owner
// @access  Private (homeowner)
const cancelBookingByOwner = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id).populate("property");
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.owner.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to cancel this booking.", 403);
  }
  if (!OWNER_CANCELLABLE_STATUSES.includes(booking.status)) {
    throw new AppError(`A booking cannot be cancelled by the owner once it reaches "${booking.status}".`, 400);
  }

  const wasPaid = booking.payment.status === "Paid";

  booking.status = "Cancelled by Owner";
  booking.isActive = false;
  booking.cancellation = {
    cancelledBy: "owner",
    reason: req.body.reason,
    cancelledAt: new Date(),
  };
  addTimeline(
    booking,
    "Cancelled by Owner",
    wasPaid ? `${req.body.reason} Any refund of the paid deposit should be arranged directly.` : req.body.reason
  );
  await booking.save();

  const io = req.app.get("io");
  if (booking.property) await releaseSeat(booking.property, io);

  io.to(booking.owner.toString()).emit("bookingRequested", { booking });
  broadcastBookingUpdate(io, booking);

  await notify(io, {
    recipient: booking.student,
    type: "BOOKING_CANCELLED_BY_OWNER",
    title: "Booking cancelled by owner",
    message: `Your booking for ${booking.property?.propertyName || "the property"} was cancelled by the owner: ${req.body.reason}`,
    relatedProperty: booking.property?._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 200, "Booking cancelled.", { booking });
});

// @desc    Home owner views booking requests for their properties
// @route   GET /api/bookings/owner
// @access  Private (homeowner)
const getOwnerBookingRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { owner: req.user._id };
  // Supports a single status ("Pending") or a comma-separated group
  // ("Rejected,Expired") so the UI can offer a grouped "Closed" tab without
  // extra round trips.
  if (status) {
    const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
    filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }

  const bookings = await BookingRequest.find(filter)
    .populate("student", POPULATE_STUDENT)
    .populate("property", "propertyName propertyType images")
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, "Booking requests fetched.", { bookings });
});

// @desc    Get a single booking's full detail + timeline
// @route   GET /api/bookings/:id
// @access  Private (the student, the owner, or an admin)
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id)
    .populate("student", POPULATE_STUDENT)
    .populate("property", POPULATE_PROPERTY)
    .populate("owner", POPULATE_OWNER);
  if (!booking) throw new AppError("Booking request not found.", 404);

  const isParty =
    booking.student._id.toString() === req.user._id.toString() ||
    booking.owner._id.toString() === req.user._id.toString();
  if (!isParty && req.user.role !== "admin") {
    throw new AppError("You are not authorized to view this booking.", 403);
  }

  sendSuccess(res, 200, "Booking fetched.", { booking });
});

// @desc    Home owner accepts a booking request
// @route   PATCH /api/bookings/:id/accept
// @access  Private (homeowner)
const acceptBookingRequest = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id).populate("property");
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.owner.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to respond to this request.", 403);
  }
  if (booking.status !== "Pending") {
    throw new AppError("This request has already been responded to.", 400);
  }

  const property = booking.property;
  if (property.availableSeats <= 0) {
    throw new AppError("No seats available to accept this request.", 400);
  }

  // Reserve the seat immediately so it can't be double-booked while the
  // student completes payment.
  property.availability.occupiedSeats += 1;
  await property.save();

  const depositAmount = property.pricing?.securityDeposit || 0;
  booking.respondedAt = new Date();

  if (depositAmount <= 0) {
    // Nothing to collect — skip the whole payment step.
    booking.status = "Confirmed";
    booking.payment.required = false;
    booking.payment.status = "Not Required";
    addTimeline(booking, "Accepted", "Booking accepted by the owner.", req.user._id);
    addTimeline(booking, "Confirmed", "No security deposit required — booking confirmed automatically.");
  } else {
    booking.status = "Accepted";
    booking.payment.required = true;
    booking.payment.amount = depositAmount;
    booking.payment.status = "Pending";
    booking.payment.deadline = paymentDeadline();
    addTimeline(
      booking,
      "Accepted",
      `Booking accepted by the owner. Please pay the deposit of Rs. ${depositAmount.toLocaleString()} before ${booking.payment.deadline.toLocaleString()}.`,
      req.user._id
    );
  }
  await booking.save();

  const io = req.app.get("io");
  io.to(booking.student.toString()).emit("bookingAccepted", { booking });
  io.to(booking.owner.toString()).emit("bookingRequested", { booking }); // refresh owner's other tabs/devices
  io.emit("availabilityUpdated", {
    propertyId: property._id,
    totalSeats: property.availability.totalSeats,
    occupiedSeats: property.availability.occupiedSeats,
    availableSeats: property.availableSeats,
  });
  broadcastBookingUpdate(io, booking);

  await notify(io, {
    recipient: booking.student,
    type: booking.status === "Confirmed" ? "BOOKING_CONFIRMED" : "BOOKING_ACCEPTED",
    title: booking.status === "Confirmed" ? "Booking confirmed" : "Booking accepted — deposit required",
    message:
      booking.status === "Confirmed"
        ? `Your booking for ${property.propertyName} is confirmed — no deposit required.`
        : `Your booking request for ${property.propertyName} has been accepted. Please pay the Rs. ${depositAmount.toLocaleString()} security deposit to confirm your booking.`,
    relatedProperty: property._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 200, "Booking request accepted.", { booking });
});

// @desc    Home owner rejects a booking request
// @route   PATCH /api/bookings/:id/reject
// @access  Private (homeowner)
const rejectBookingRequest = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id).populate("property");
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.owner.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to respond to this request.", 403);
  }
  if (booking.status !== "Pending") {
    throw new AppError("This request has already been responded to.", 400);
  }

  booking.status = "Rejected";
  booking.isActive = false;
  booking.respondedAt = new Date();
  addTimeline(booking, "Rejected", req.body.reason || "", req.user._id);
  await booking.save();

  const io = req.app.get("io");
  io.to(booking.student.toString()).emit("bookingRejected", { booking });
  io.to(booking.owner.toString()).emit("bookingRequested", { booking }); // refresh owner's other tabs/devices
  broadcastBookingUpdate(io, booking);

  await notify(io, {
    recipient: booking.student,
    type: "BOOKING_REJECTED",
    title: "Booking rejected",
    message: `Your booking request for ${booking.property.propertyName} was rejected.${req.body.reason ? ` Reason: ${req.body.reason}` : ""}`,
    relatedProperty: booking.property._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 200, "Booking request rejected.", { booking });
});

// ---------------------------------------------------------------------------
// Payment: Online
// ---------------------------------------------------------------------------

// @desc    Start an online payment attempt for the security deposit
// @route   POST /api/bookings/:id/payment/online/initiate
// @access  Private (student)
const initiateOnlinePayment = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id);
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.student.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to pay for this booking.", 403);
  }
  if (booking.status !== "Accepted" || !booking.payment.required) {
    throw new AppError("This booking isn't awaiting a security deposit payment.", 400);
  }
  if (!["Pending", "Failed"].includes(booking.payment.status)) {
    throw new AppError(`Payment is already "${booking.payment.status}" for this booking.`, 400);
  }

  booking.payment.method = "Online";
  await booking.save();

  const order = await paymentService.createOrder({ bookingId: booking._id, amount: booking.payment.amount });

  sendSuccess(res, 200, "Payment order created.", { order });
});

// @desc    Confirm the result of an online payment attempt
// @route   POST /api/bookings/:id/payment/online/verify
// @access  Private (student)
const verifyOnlinePayment = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id).populate("property");
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.student.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to pay for this booking.", 403);
  }
  if (booking.status !== "Accepted" || booking.payment.status === "Paid") {
    throw new AppError("This booking isn't awaiting a security deposit payment.", 400);
  }

  const { success, transactionId } = req.body;
  const result = await paymentService.verifyPayment({ transactionId, success });
  booking.payment.attempts += 1;

  const io = req.app.get("io");

  if (result.verified) {
    booking.payment.status = "Paid";
    booking.payment.transactionId = result.transactionId;
    booking.payment.paidAt = new Date();
    booking.status = "Confirmed";
    addTimeline(booking, "Confirmed", `Online payment of Rs. ${booking.payment.amount.toLocaleString()} received (txn ${result.transactionId}).`);
    await booking.save();

    broadcastBookingUpdate(io, booking);
    await notify(io, {
      recipient: booking.owner,
      type: "PAYMENT_VERIFIED",
      title: "Security deposit received",
      message: `${req.user.fullName} paid the security deposit online for ${booking.property?.propertyName || "your property"}. Booking confirmed.`,
      relatedProperty: booking.property?._id,
      relatedBooking: booking._id,
    });

    return sendSuccess(res, 200, "Payment successful — booking confirmed.", { booking });
  }

  booking.payment.status = "Failed";
  addTimeline(booking, "Accepted", "Online payment attempt failed. You can retry payment.");
  await booking.save();
  broadcastBookingUpdate(io, booking);

  sendSuccess(res, 200, "Payment failed. You can retry.", { booking });
});

// ---------------------------------------------------------------------------
// Payment: Offline
// ---------------------------------------------------------------------------

// @desc    Student marks the deposit as paid offline (cash/UPI/bank transfer)
// @route   POST /api/bookings/:id/payment/offline/submit
// @access  Private (student)
const submitOfflinePayment = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id).populate("property");
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.student.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to pay for this booking.", 403);
  }
  if (booking.status !== "Accepted" || !booking.payment.required) {
    throw new AppError("This booking isn't awaiting a security deposit payment.", 400);
  }
  if (!["Pending", "Failed"].includes(booking.payment.status)) {
    throw new AppError(`Payment is already "${booking.payment.status}" for this booking.`, 400);
  }

  booking.payment.method = "Offline";
  booking.payment.status = "Awaiting Verification";
  booking.payment.offlineNote = req.body.note;
  booking.payment.paidAt = new Date();
  booking.payment.attempts += 1;
  booking.payment.rejectionReason = "";
  addTimeline(booking, "Accepted", `Student marked the deposit as paid offline: "${req.body.note}". Awaiting owner verification.`);
  await booking.save();

  const io = req.app.get("io");
  broadcastBookingUpdate(io, booking);
  io.to(booking.owner.toString()).emit("bookingRequested", { booking });

  await notify(io, {
    recipient: booking.owner,
    type: "PAYMENT_SUBMITTED",
    title: "Offline payment submitted",
    message: `${req.user.fullName} says they've paid the deposit offline for ${booking.property?.propertyName || "your property"}. Please verify.`,
    relatedProperty: booking.property?._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 200, "Marked as paid. Waiting for the owner to verify.", { booking });
});

// @desc    Owner approves or rejects a student's offline payment claim
// @route   PATCH /api/bookings/:id/payment/offline/verify
// @access  Private (homeowner)
const verifyOfflinePayment = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id).populate("property");
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.owner.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to verify this payment.", 403);
  }
  if (booking.payment.status !== "Awaiting Verification") {
    throw new AppError("There's no offline payment awaiting verification for this booking.", 400);
  }

  const { approve, reason } = req.body;
  const io = req.app.get("io");

  if (approve) {
    booking.payment.status = "Paid";
    booking.payment.verifiedAt = new Date();
    booking.payment.verifiedBy = req.user._id;
    booking.status = "Confirmed";
    addTimeline(booking, "Confirmed", "Offline payment verified by the owner.", req.user._id);
    await booking.save();

    broadcastBookingUpdate(io, booking);
    await notify(io, {
      recipient: booking.student,
      type: "PAYMENT_VERIFIED",
      title: "Payment verified — booking confirmed",
      message: `Your offline payment for ${booking.property?.propertyName || "the property"} was verified. Your booking is confirmed.`,
      relatedProperty: booking.property?._id,
      relatedBooking: booking._id,
    });

    return sendSuccess(res, 200, "Payment verified — booking confirmed.", { booking });
  }

  booking.payment.status = "Failed";
  booking.payment.rejectionReason = reason || "Payment could not be verified.";
  addTimeline(booking, "Accepted", `Offline payment rejected by the owner: ${booking.payment.rejectionReason}. You may submit again.`, req.user._id);
  await booking.save();

  broadcastBookingUpdate(io, booking);
  await notify(io, {
    recipient: booking.student,
    type: "PAYMENT_REJECTED",
    title: "Offline payment rejected",
    message: `Your offline payment claim for ${booking.property?.propertyName || "the property"} was rejected: ${booking.payment.rejectionReason} You can submit again.`,
    relatedProperty: booking.property?._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 200, "Payment rejected. The student can submit again.", { booking });
});

// ---------------------------------------------------------------------------
// Move-in
// ---------------------------------------------------------------------------

// @desc    Owner confirms the student has moved in
// @route   PATCH /api/bookings/:id/movein/confirm
// @access  Private (homeowner)
const confirmMoveIn = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id).populate("property");
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.owner.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to confirm move-in for this booking.", 403);
  }
  if (!["Confirmed", "Move-in Pending"].includes(booking.status)) {
    throw new AppError(`Move-in can't be confirmed while the booking is "${booking.status}".`, 400);
  }

  booking.status = "Occupied";
  booking.moveIn.confirmedAt = new Date();
  booking.moveIn.confirmedBy = req.user._id;
  addTimeline(booking, "Occupied", "Move-in confirmed by the owner.", req.user._id);
  await booking.save();

  const io = req.app.get("io");
  broadcastBookingUpdate(io, booking);

  await notify(io, {
    recipient: booking.student,
    type: "MOVE_IN_CONFIRMED",
    title: "Move-in confirmed",
    message: `Your move-in for ${booking.property?.propertyName || "the property"} has been confirmed. Welcome in!`,
    relatedProperty: booking.property?._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 200, "Move-in confirmed.", { booking });
});

// ---------------------------------------------------------------------------
// Vacate
// ---------------------------------------------------------------------------

// @desc    Student requests to vacate an occupied booking
// @route   PATCH /api/bookings/:id/vacate/request
// @access  Private (student)
const requestVacate = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id).populate("property");
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.student.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to request vacating this booking.", 403);
  }
  if (booking.status !== "Occupied") {
    throw new AppError("Only an occupied booking can be vacated.", 400);
  }

  booking.status = "Vacate Requested";
  booking.vacate.requestedAt = new Date();
  booking.vacate.reason = req.body.reason || "";
  addTimeline(booking, "Vacate Requested", req.body.reason || "Student requested to vacate.");
  await booking.save();

  const io = req.app.get("io");
  broadcastBookingUpdate(io, booking);
  io.to(booking.owner.toString()).emit("bookingRequested", { booking });

  await notify(io, {
    recipient: booking.owner,
    type: "VACATE_REQUESTED",
    title: "Vacate request received",
    message: `${req.user.fullName} requested to vacate ${booking.property?.propertyName || "your property"}.`,
    relatedProperty: booking.property?._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 200, "Vacate request sent to the owner.", { booking });
});

// @desc    Owner approves a vacate request, freeing the seat
// @route   PATCH /api/bookings/:id/vacate/approve
// @access  Private (homeowner)
const approveVacate = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id).populate("property");
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.owner.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to approve this vacate request.", 403);
  }
  if (booking.status !== "Vacate Requested") {
    throw new AppError("There's no pending vacate request for this booking.", 400);
  }

  booking.status = "Completed";
  booking.isActive = false;
  booking.vacate.approvedAt = new Date();
  booking.completedAt = new Date();
  addTimeline(booking, "Completed", "Vacate approved by the owner. The seat is now available again.", req.user._id);
  await booking.save();

  const io = req.app.get("io");
  if (booking.property) await releaseSeat(booking.property, io);
  broadcastBookingUpdate(io, booking);

  await notify(io, {
    recipient: booking.student,
    type: "VACATE_APPROVED",
    title: "Vacate approved",
    message: `Your vacate request for ${booking.property?.propertyName || "the property"} was approved. Thanks for staying with us!`,
    relatedProperty: booking.property?._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 200, "Vacate approved. Booking completed.", { booking });
});

// @desc    Owner rejects a vacate request (booking remains occupied)
// @route   PATCH /api/bookings/:id/vacate/reject
// @access  Private (homeowner)
const rejectVacate = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id).populate("property");
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.owner.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to reject this vacate request.", 403);
  }
  if (booking.status !== "Vacate Requested") {
    throw new AppError("There's no pending vacate request for this booking.", 400);
  }

  booking.status = "Occupied";
  booking.vacate.rejectedAt = new Date();
  booking.vacate.rejectionReason = req.body.reason || "";
  addTimeline(booking, "Occupied", `Vacate request declined by the owner.${req.body.reason ? ` Reason: ${req.body.reason}` : ""}`, req.user._id);
  await booking.save();

  const io = req.app.get("io");
  broadcastBookingUpdate(io, booking);

  await notify(io, {
    recipient: booking.student,
    type: "VACATE_REJECTED",
    title: "Vacate request declined",
    message: `Your vacate request for ${booking.property?.propertyName || "the property"} was declined.${req.body.reason ? ` Reason: ${req.body.reason}` : ""}`,
    relatedProperty: booking.property?._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 200, "Vacate request declined.", { booking });
});

module.exports = {
  createBookingRequest,
  cancelBookingRequest,
  cancelBookingByOwner,
  getOwnerBookingRequests,
  getBookingById,
  acceptBookingRequest,
  rejectBookingRequest,
  initiateOnlinePayment,
  verifyOnlinePayment,
  submitOfflinePayment,
  verifyOfflinePayment,
  confirmMoveIn,
  requestVacate,
  approveVacate,
  rejectVacate,
};
