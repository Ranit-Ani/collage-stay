const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  updateProfile,
  uploadProfilePicture,
  addFavourite,
  removeFavourite,
  getFavourites,
  getBookingHistory,
} = require("../controllers/studentController");

router.use(protect, authorize("student"));

router.put("/profile", updateProfile);
router.post("/profile-picture", upload.single("image"), uploadProfilePicture);
router.get("/favourites", getFavourites);
router.post("/favourites/:propertyId", addFavourite);
router.delete("/favourites/:propertyId", removeFavourite);
router.get("/bookings", getBookingHistory);

module.exports = router;
