const User = require("../models/User");
const Property = require("../models/Property");
const Review = require("../models/Review");
const BookingRequest = require("../models/BookingRequest");
const Notification = require("../models/Notification");
const asyncHandler = require("../middlewares/asyncHandler");
const { AppError } = require("../middlewares/errorMiddleware");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Dashboard statistics overview
// @route   GET /api/admin/dashboard-stats
// @access  Private (admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalHomeOwners,
    totalProperties,
    pendingProperties,
    approvedProperties,
    totalBookings,
    totalReviews,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "homeowner" }),
    Property.countDocuments(),
    Property.countDocuments({ status: "pending" }),
    Property.countDocuments({ status: "approved" }),
    BookingRequest.countDocuments(),
    Review.countDocuments(),
  ]);

  sendSuccess(res, 200, "Dashboard stats fetched.", {
    totalStudents,
    totalHomeOwners,
    totalProperties,
    pendingProperties,
    approvedProperties,
    totalBookings,
    totalReviews,
  });
});

// @desc    List all students
// @route   GET /api/admin/students
// @access  Private (admin)
const getAllStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: "student" }).sort({ createdAt: -1 });
  sendSuccess(res, 200, "Students fetched.", { students });
});

// @desc    List all home owners
// @route   GET /api/admin/home-owners
// @access  Private (admin)
const getAllHomeOwners = asyncHandler(async (req, res) => {
  const owners = await User.find({ role: "homeowner" }).sort({ createdAt: -1 });
  sendSuccess(res, 200, "Home owners fetched.", { owners });
});

// @desc    Block or unblock a user
// @route   PATCH /api/admin/users/:id/toggle-block
// @access  Private (admin)
const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found.", 404);
  if (user.role === "admin") throw new AppError("Cannot block an admin account.", 400);

  user.isBlocked = !user.isBlocked;
  await user.save();

  sendSuccess(res, 200, `User ${user.isBlocked ? "blocked" : "unblocked"} successfully.`, {
    user: user.toSafeObject(),
  });
});

// @desc    Delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found.", 404);
  if (user.role === "admin") throw new AppError("Cannot delete an admin account.", 400);

  await user.deleteOne();
  sendSuccess(res, 200, "User deleted successfully.");
});

// @desc    Get all pending property listings
// @route   GET /api/admin/properties/pending
// @access  Private (admin)
const getPendingProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ status: "pending" })
    .populate("owner", "fullName email phone")
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, "Pending properties fetched.", { properties });
});

// @desc    Approve a property listing
// @route   PATCH /api/admin/properties/:id/approve
// @access  Private (admin)
const approveProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError("Property not found.", 404);

  property.status = "approved";
  property.rejectionReason = "";
  await property.save();

  const io = req.app.get("io");
  io.emit("propertyApproved", { propertyId: property._id });
  io.emit("propertyUpdated", { propertyId: property._id });

  await Notification.create({
    recipient: property.owner,
    type: "PROPERTY_APPROVED",
    title: "Listing approved",
    message: `Your property "${property.propertyName}" has been approved and is now live.`,
    relatedProperty: property._id,
  });
  io.to(property.owner.toString()).emit("notificationReceived", {
    title: "Listing approved",
    message: `Your property "${property.propertyName}" has been approved and is now live.`,
  });

  sendSuccess(res, 200, "Property approved.", { property });
});

// @desc    Reject a property listing
// @route   PATCH /api/admin/properties/:id/reject
// @access  Private (admin)
const rejectProperty = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError("Property not found.", 404);

  property.status = "rejected";
  property.rejectionReason = reason || "Did not meet listing guidelines.";
  await property.save();

  const io = req.app.get("io");
  io.emit("propertyRejected", { propertyId: property._id });

  await Notification.create({
    recipient: property.owner,
    type: "PROPERTY_REJECTED",
    title: "Listing rejected",
    message: `Your property "${property.propertyName}" was rejected: ${property.rejectionReason}`,
    relatedProperty: property._id,
  });
  io.to(property.owner.toString()).emit("notificationReceived", {
    title: "Listing rejected",
    message: `Your property "${property.propertyName}" was rejected: ${property.rejectionReason}`,
  });

  sendSuccess(res, 200, "Property rejected.", { property });
});

// @desc    Delete any property (moderation)
// @route   DELETE /api/admin/properties/:id
// @access  Private (admin)
const deleteAnyProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError("Property not found.", 404);
  await property.deleteOne();

  sendSuccess(res, 200, "Property deleted successfully.");
});

// @desc    Get all reviews (for moderation)
// @route   GET /api/admin/reviews
// @access  Private (admin)
const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate("student", "fullName email")
    .populate("property", "propertyName")
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, "Reviews fetched.", { reviews });
});

// @desc    Delete a review (moderation)
// @route   DELETE /api/admin/reviews/:id
// @access  Private (admin)
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError("Review not found.", 404);
  await review.deleteOne();

  sendSuccess(res, 200, "Review deleted successfully.");
});

module.exports = {
  getDashboardStats,
  getAllStudents,
  getAllHomeOwners,
  toggleBlockUser,
  deleteUser,
  getPendingProperties,
  approveProperty,
  rejectProperty,
  deleteAnyProperty,
  getAllReviews,
  deleteReview,
};
