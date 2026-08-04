const User = require("../models/User");
const Property = require("../models/Property");
const BookingRequest = require("../models/BookingRequest");
const asyncHandler = require("../middlewares/asyncHandler");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const { sendSuccess } = require("../utils/apiResponse");
const { AppError } = require("../middlewares/errorMiddleware");

// @desc    Update home owner profile
// @route   PUT /api/home-owners/profile
// @access  Private (homeowner)
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, businessName } = req.body;

  const user = await User.findById(req.user._id);
  if (fullName) user.fullName = fullName;
  if (phone) user.phone = phone;
  if (businessName) user.businessName = businessName;

  await user.save();
  sendSuccess(res, 200, "Profile updated successfully.", { user: user.toSafeObject() });
});

// @desc    Upload / replace profile picture
// @route   POST /api/home-owners/profile-picture
// @access  Private (homeowner)
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("No image file provided.", 400);

  const user = await User.findById(req.user._id);
  if (user.profilePicture?.publicId) {
    await deleteFromCloudinary(user.profilePicture.publicId);
  }

  const { url, publicId } = await uploadBufferToCloudinary(
    req.file.buffer,
    "collegestay/profile-pictures"
  );

  user.profilePicture = { url, publicId };
  await user.save();

  sendSuccess(res, 200, "Profile picture updated.", { profilePicture: user.profilePicture });
});

// @desc    Dashboard summary: property count, pending requests, occupancy
// @route   GET /api/home-owners/dashboard-stats
// @access  Private (homeowner)
const getDashboardStats = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;

  const [totalProperties, approvedProperties, pendingRequests, properties] = await Promise.all([
    Property.countDocuments({ owner: ownerId }),
    Property.countDocuments({ owner: ownerId, status: "approved" }),
    BookingRequest.countDocuments({ owner: ownerId, status: "Pending" }),
    Property.find({ owner: ownerId }),
  ]);

  const totalSeats = properties.reduce((sum, p) => sum + p.availability.totalSeats, 0);
  const occupiedSeats = properties.reduce((sum, p) => sum + p.availability.occupiedSeats, 0);

  sendSuccess(res, 200, "Dashboard stats fetched.", {
    totalProperties,
    approvedProperties,
    pendingRequests,
    totalSeats,
    occupiedSeats,
    availableSeats: Math.max(totalSeats - occupiedSeats, 0),
  });
});

module.exports = { updateProfile, uploadProfilePicture, getDashboardStats };
