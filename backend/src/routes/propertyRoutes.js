const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { parseJsonFields } = require("../middlewares/parseJsonFields");
const { validate } = require("../middlewares/validateMiddleware");
const { createPropertyValidator } = require("../validators/propertyValidator");
const {
  createProperty,
  updateProperty,
  updateAvailability,
  addImages,
  deleteImage,
  deleteProperty,
  getMyProperties,
  getPropertyById,
  searchProperties,
} = require("../controllers/propertyController");

// Public
router.get("/", searchProperties);

// Home owner (must come before /:id to avoid route collision)
router.get("/mine", protect, authorize("homeowner"), getMyProperties);

router.post(
  "/",
  protect,
  authorize("homeowner"),
  upload.array("images", 10),
  parseJsonFields(["address", "location", "pricing", "availability", "amenities", "rules", "messDetails"]),
  validate(createPropertyValidator),
  createProperty
);
router.put("/:id", protect, authorize("homeowner"), updateProperty);
router.patch("/:id/availability", protect, authorize("homeowner"), updateAvailability);
router.post("/:id/images", protect, authorize("homeowner"), upload.array("images", 10), addImages);
router.delete("/:id/images/:publicId", protect, authorize("homeowner"), deleteImage);
router.delete("/:id", protect, authorize("homeowner", "admin"), deleteProperty);

// Public - must come after the more specific routes above
router.get("/:id", getPropertyById);

module.exports = router;
