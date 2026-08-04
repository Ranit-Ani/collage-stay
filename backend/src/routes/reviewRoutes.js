const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { validate } = require("../middlewares/validateMiddleware");
const { reviewValidator } = require("../validators/propertyValidator");
const {
  createReview,
  updateReview,
  deleteReview,
  getPropertyReviews,
} = require("../controllers/reviewController");

router.get("/:propertyId", getPropertyReviews);
router.post("/:propertyId", protect, authorize("student"), validate(reviewValidator), createReview);
router.put("/:id", protect, authorize("student"), updateReview);
router.delete("/:id", protect, authorize("student", "admin"), deleteReview);

module.exports = router;
