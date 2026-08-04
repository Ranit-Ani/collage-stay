const Review = require("../models/Review");
const Property = require("../models/Property");
const asyncHandler = require("../middlewares/asyncHandler");
const { AppError } = require("../middlewares/errorMiddleware");
const { sendSuccess } = require("../utils/apiResponse");

const recalculateAverageRating = async (propertyId) => {
  const stats = await Review.aggregate([
    { $match: { property: propertyId } },
    {
      $group: {
        _id: "$property",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const property = await Property.findById(propertyId);
  if (!property) return;

  if (stats.length > 0) {
    property.averageRating = Math.round(stats[0].avgRating * 10) / 10;
    property.totalReviews = stats[0].count;
  } else {
    property.averageRating = 0;
    property.totalReviews = 0;
  }
  await property.save();
};

// @desc    Submit a review + rating for a property
// @route   POST /api/reviews/:propertyId
// @access  Private (student)
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const property = await Property.findById(req.params.propertyId);
  if (!property) throw new AppError("Property not found.", 404);

  const existing = await Review.findOne({
    student: req.user._id,
    property: property._id,
  });
  if (existing) {
    throw new AppError("You have already reviewed this property.", 409);
  }

  const review = await Review.create({
    student: req.user._id,
    property: property._id,
    rating,
    comment,
  });

  await recalculateAverageRating(property._id);

  const io = req.app.get("io");
  io.emit("reviewAdded", { reviewId: review._id, propertyId: property._id });
  io.emit("propertyUpdated", { propertyId: property._id }); // rating average changed

  sendSuccess(res, 201, "Review submitted successfully.", { review });
});

// @desc    Update own review
// @route   PUT /api/reviews/:id
// @access  Private (student - author)
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError("Review not found.", 404);
  if (review.student.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to edit this review.", 403);
  }

  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  await review.save();

  await recalculateAverageRating(review.property);

  const io = req.app.get("io");
  io.emit("reviewUpdated", { reviewId: review._id, propertyId: review.property });
  io.emit("propertyUpdated", { propertyId: review.property });

  sendSuccess(res, 200, "Review updated successfully.", { review });
});

// @desc    Delete own review (or admin moderation)
// @route   DELETE /api/reviews/:id
// @access  Private (student - author, or admin)
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError("Review not found.", 404);

  const isAuthor = review.student.toString() === req.user._id.toString();
  if (!isAuthor && req.user.role !== "admin") {
    throw new AppError("You are not authorized to delete this review.", 403);
  }

  const propertyId = review.property;
  const reviewId = review._id;
  await review.deleteOne();
  await recalculateAverageRating(propertyId);

  const io = req.app.get("io");
  io.emit("reviewDeleted", { reviewId, propertyId });
  io.emit("propertyUpdated", { propertyId });

  sendSuccess(res, 200, "Review deleted successfully.");
});

// @desc    Get all reviews for a property
// @route   GET /api/reviews/:propertyId
// @access  Public
const getPropertyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ property: req.params.propertyId })
    .populate("student", "fullName profilePicture")
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, "Reviews fetched.", { reviews });
});

module.exports = { createReview, updateReview, deleteReview, getPropertyReviews };
