const User = require("../models/User");
const Property = require("../models/Property");
const BookingRequest = require("../models/BookingRequest");
const asyncHandler = require("../middlewares/asyncHandler");
const { AppError } = require("../middlewares/errorMiddleware");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Private (student)
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, collegeName } = req.body;

  const user = await User.findById(req.user._id);
  if (fullName) user.fullName = fullName;
  if (phone) user.phone = phone;
  if (collegeName) user.collegeName = collegeName;

  await user.save();
  sendSuccess(res, 200, "Profile updated successfully.", { user: user.toSafeObject() });
});

// @desc    Upload / replace profile picture
// @route   POST /api/students/profile-picture
// @access  Private (student)
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

// @desc    Add a property to favourites
// @route   POST /api/students/favourites/:propertyId
// @access  Private (student)
const addFavourite = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.propertyId);
  if (!property) throw new AppError("Property not found.", 404);

  const user = await User.findById(req.user._id);
  if (!user.favouriteProperties.includes(property._id)) {
    user.favouriteProperties.push(property._id);
    await user.save();
  }

  sendSuccess(res, 200, "Property added to favourites.");
});

// @desc    Remove a property from favourites
// @route   DELETE /api/students/favourites/:propertyId
// @access  Private (student)
const removeFavourite = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.favouriteProperties = user.favouriteProperties.filter(
    (id) => id.toString() !== req.params.propertyId
  );
  await user.save();

  sendSuccess(res, 200, "Property removed from favourites.");
});

// @desc    List favourite properties
// @route   GET /api/students/favourites
// @access  Private (student)
const getFavourites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "favouriteProperties",
    match: { isActive: true, status: "approved" },
  });

  sendSuccess(res, 200, "Favourites fetched.", { favourites: user.favouriteProperties });
});

// @desc    Get booking history for the logged-in student
// @route   GET /api/students/bookings
// @access  Private (student)
const getBookingHistory = asyncHandler(async (req, res) => {
  const bookings = await BookingRequest.find({ student: req.user._id })
    .populate("property", "propertyName propertyType images pricing address")
    .populate("owner", "fullName phone email")
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, "Booking history fetched.", { bookings });
});

module.exports = {
  updateProfile,
  uploadProfilePicture,
  addFavourite,
  removeFavourite,
  getFavourites,
  getBookingHistory,
};
