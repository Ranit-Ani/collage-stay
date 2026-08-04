const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const {
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
} = require("../controllers/adminController");

router.use(protect, authorize("admin"));

router.get("/dashboard-stats", getDashboardStats);

router.get("/students", getAllStudents);
router.get("/home-owners", getAllHomeOwners);
router.patch("/users/:id/toggle-block", toggleBlockUser);
router.delete("/users/:id", deleteUser);

router.get("/properties/pending", getPendingProperties);
router.patch("/properties/:id/approve", approveProperty);
router.patch("/properties/:id/reject", rejectProperty);
router.delete("/properties/:id", deleteAnyProperty);

router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReview);

module.exports = router;
