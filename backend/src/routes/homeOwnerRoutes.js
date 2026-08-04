const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  updateProfile,
  uploadProfilePicture,
  getDashboardStats,
} = require("../controllers/homeOwnerController");

router.use(protect, authorize("homeowner"));

router.put("/profile", updateProfile);
router.post("/profile-picture", upload.single("image"), uploadProfilePicture);
router.get("/dashboard-stats", getDashboardStats);

module.exports = router;
