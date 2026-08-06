const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const { validate } = require("../middlewares/validateMiddleware");
const {
  createBookingValidator,
  optionalReasonValidator,
  requiredReasonValidator,
  offlineSubmitValidator,
  offlineVerifyValidator,
  onlineVerifyValidator,
} = require("../validators/bookingValidator");
const {
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
} = require("../controllers/bookingController");

router.use(protect);

router.post("/", authorize("student"), validate(createBookingValidator), createBookingRequest);
router.patch("/:id/cancel", authorize("student"), validate(optionalReasonValidator), cancelBookingRequest);
router.patch("/:id/cancel-by-owner", authorize("homeowner"), validate(requiredReasonValidator), cancelBookingByOwner);

router.get("/owner", authorize("homeowner"), getOwnerBookingRequests);
router.get("/:id", getBookingById);

router.patch("/:id/accept", authorize("homeowner"), acceptBookingRequest);
router.patch("/:id/reject", authorize("homeowner"), validate(optionalReasonValidator), rejectBookingRequest);

// Security deposit payment
router.post("/:id/payment/online/initiate", authorize("student"), initiateOnlinePayment);
router.post("/:id/payment/online/verify", authorize("student"), validate(onlineVerifyValidator), verifyOnlinePayment);
router.post("/:id/payment/offline/submit", authorize("student"), validate(offlineSubmitValidator), submitOfflinePayment);
router.patch("/:id/payment/offline/verify", authorize("homeowner"), validate(offlineVerifyValidator), verifyOfflinePayment);

// Move-in
router.patch("/:id/movein/confirm", authorize("homeowner"), confirmMoveIn);

// Vacate
router.patch("/:id/vacate/request", authorize("student"), validate(optionalReasonValidator), requestVacate);
router.patch("/:id/vacate/approve", authorize("homeowner"), approveVacate);
router.patch("/:id/vacate/reject", authorize("homeowner"), validate(optionalReasonValidator), rejectVacate);

module.exports = router;
