const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const {
  createBookingRequest,
  cancelBookingRequest,
  getOwnerBookingRequests,
  acceptBookingRequest,
  rejectBookingRequest,
} = require("../controllers/bookingController");

router.use(protect);

router.post("/", authorize("student"), createBookingRequest);
router.patch("/:id/cancel", authorize("student"), cancelBookingRequest);

router.get("/owner", authorize("homeowner"), getOwnerBookingRequests);
router.patch("/:id/accept", authorize("homeowner"), acceptBookingRequest);
router.patch("/:id/reject", authorize("homeowner"), rejectBookingRequest);

module.exports = router;
