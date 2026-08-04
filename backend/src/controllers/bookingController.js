const BookingRequest = require("../models/BookingRequest");
const Property = require("../models/Property");
const Notification = require("../models/Notification");
const asyncHandler = require("../middlewares/asyncHandler");
const { AppError } = require("../middlewares/errorMiddleware");
const { sendSuccess } = require("../utils/apiResponse");

const createNotification = async (io, { recipient, type, title, message, relatedProperty, relatedBooking }) => {
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
    status: { $in: ["Pending", "Accepted"] },
  });
  if (existingActive) {
    throw new AppError(
      existingActive.status === "Accepted"
        ? "You already have an accepted booking for this property."
        : "You already have a pending request for this property.",
      409
    );
  }

  let booking;
  try {
    booking = await BookingRequest.create({
      student: req.user._id,
      property: propertyId,
      owner: property.owner,
      message,
      moveInDate,
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

  await createNotification(io, {
    recipient: property.owner,
    type: "BOOKING_REQUEST_RECEIVED",
    title: "New booking request",
    message: `${req.user.fullName} sent a booking request for ${property.propertyName}.`,
    relatedProperty: property._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 201, "Booking request sent successfully.", { booking });
});

// @desc    Student cancels their own pending booking request
// @route   PATCH /api/bookings/:id/cancel
// @access  Private (student)
const cancelBookingRequest = asyncHandler(async (req, res) => {
  const booking = await BookingRequest.findById(req.params.id);
  if (!booking) throw new AppError("Booking request not found.", 404);
  if (booking.student.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to cancel this request.", 403);
  }
  if (booking.status !== "Pending") {
    throw new AppError("Only pending requests can be cancelled.", 400);
  }

  booking.status = "Cancelled";
  booking.respondedAt = new Date();
  await booking.save();

  const io = req.app.get("io");
  io.to(booking.owner.toString()).emit("bookingRequested", { booking }); // refresh owner's list

  sendSuccess(res, 200, "Booking request cancelled.", { booking });
});

// @desc    Home owner views booking requests for their properties
// @route   GET /api/bookings/owner
// @access  Private (homeowner)
const getOwnerBookingRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { owner: req.user._id };
  if (status) filter.status = status;

  const bookings = await BookingRequest.find(filter)
    .populate("student", "fullName email phone profilePicture collegeName")
    .populate("property", "propertyName propertyType images")
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, "Booking requests fetched.", { bookings });
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

  booking.status = "Accepted";
  booking.respondedAt = new Date();
  await booking.save();

  property.availability.occupiedSeats += 1;
  await property.save();

  const io = req.app.get("io");
  io.to(booking.student.toString()).emit("bookingAccepted", { booking });
  io.emit("availabilityUpdated", {
    propertyId: property._id,
    totalSeats: property.availability.totalSeats,
    occupiedSeats: property.availability.occupiedSeats,
    availableSeats: property.availableSeats,
  });

  await createNotification(io, {
    recipient: booking.student,
    type: "BOOKING_ACCEPTED",
    title: "Booking accepted",
    message: `Your booking request for ${property.propertyName} has been accepted.`,
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
  booking.respondedAt = new Date();
  await booking.save();

  const io = req.app.get("io");
  io.to(booking.student.toString()).emit("bookingRejected", { booking });

  await createNotification(io, {
    recipient: booking.student,
    type: "BOOKING_REJECTED",
    title: "Booking rejected",
    message: `Your booking request for ${booking.property.propertyName} was rejected.`,
    relatedProperty: booking.property._id,
    relatedBooking: booking._id,
  });

  sendSuccess(res, 200, "Booking request rejected.", { booking });
});

module.exports = {
  createBookingRequest,
  cancelBookingRequest,
  getOwnerBookingRequests,
  acceptBookingRequest,
  rejectBookingRequest,
};
