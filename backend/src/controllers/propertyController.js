const Property = require("../models/Property");
const asyncHandler = require("../middlewares/asyncHandler");
const { AppError } = require("../middlewares/errorMiddleware");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Create a new property listing (goes to "pending" for admin approval)
// @route   POST /api/properties
// @access  Private (homeowner)
const createProperty = asyncHandler(async (req, res) => {
  const body = req.body;

  let images = [];
  if (req.files && req.files.length > 0) {
    const uploads = await Promise.all(
      req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, "collegestay/properties")
      )
    );
    images = uploads;
  }

  const property = await Property.create({
    owner: req.user._id,
    propertyName: body.propertyName,
    propertyType: body.propertyType,
    contactNumber: body.contactNumber,
    email: body.email,
    address: body.address,
    location: body.location,
    nearbyCollege: body.nearbyCollege,
    distanceFromCollege: body.distanceFromCollege,
    pricing: body.pricing,
    availability: body.availability,
    amenities: body.amenities,
    rules: body.rules,
    messDetails: body.propertyType === "Mess" ? body.messDetails : undefined,
    images,
    status: "pending",
  });

  sendSuccess(res, 201, "Property submitted for admin approval.", { property });
});

// @desc    Update a property (owner only, resets to pending if key info changes)
// @route   PUT /api/properties/:id
// @access  Private (homeowner - owner of the property)
const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError("Property not found.", 404);
  if (property.owner.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to update this property.", 403);
  }

  const updatableFields = [
    "propertyName",
    "propertyType",
    "contactNumber",
    "email",
    "address",
    "location",
    "nearbyCollege",
    "distanceFromCollege",
    "pricing",
    "amenities",
    "rules",
    "messDetails",
  ];
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) property[field] = req.body[field];
  });

  await property.save();
  sendSuccess(res, 200, "Property updated successfully.", { property });
});

// @desc    Update available seats (triggers real-time availabilityUpdated event)
// @route   PATCH /api/properties/:id/availability
// @access  Private (homeowner - owner of the property)
const updateAvailability = asyncHandler(async (req, res) => {
  const { totalSeats, occupiedSeats } = req.body;
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError("Property not found.", 404);
  if (property.owner.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to update this property.", 403);
  }

  if (totalSeats !== undefined) property.availability.totalSeats = totalSeats;
  if (occupiedSeats !== undefined) property.availability.occupiedSeats = occupiedSeats;
  await property.save();

  const io = req.app.get("io");
  io.emit("availabilityUpdated", {
    propertyId: property._id,
    totalSeats: property.availability.totalSeats,
    occupiedSeats: property.availability.occupiedSeats,
    availableSeats: property.availableSeats,
  });
  io.emit("propertyUpdated", { propertyId: property._id });

  sendSuccess(res, 200, "Availability updated.", { property });
});

// @desc    Add additional images to an existing property
// @route   POST /api/properties/:id/images
// @access  Private (homeowner - owner of the property)
const addImages = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError("Property not found.", 404);
  if (property.owner.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to update this property.", 403);
  }
  if (!req.files || req.files.length === 0) {
    throw new AppError("No image files provided.", 400);
  }

  const uploads = await Promise.all(
    req.files.map((file) => uploadBufferToCloudinary(file.buffer, "collegestay/properties"))
  );
  property.images.push(...uploads);
  await property.save();

  sendSuccess(res, 200, "Images added.", { images: property.images });
});

// @desc    Delete a single image from a property
// @route   DELETE /api/properties/:id/images/:publicId
// @access  Private (homeowner - owner of the property)
const deleteImage = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError("Property not found.", 404);
  if (property.owner.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to update this property.", 403);
  }

  const decodedPublicId = decodeURIComponent(req.params.publicId);
  await deleteFromCloudinary(decodedPublicId);
  property.images = property.images.filter((img) => img.publicId !== decodedPublicId);
  await property.save();

  sendSuccess(res, 200, "Image deleted.", { images: property.images });
});

// @desc    Delete a property entirely
// @route   DELETE /api/properties/:id
// @access  Private (homeowner - owner, or admin)
const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new AppError("Property not found.", 404);

  const isOwner = property.owner.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    throw new AppError("You are not authorized to delete this property.", 403);
  }

  await Promise.all(
    property.images.map((img) => deleteFromCloudinary(img.publicId))
  );
  await property.deleteOne();

  sendSuccess(res, 200, "Property deleted successfully.");
});

// @desc    Get properties owned by the logged-in home owner
// @route   GET /api/properties/mine
// @access  Private (homeowner)
const getMyProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
  sendSuccess(res, 200, "Your properties fetched.", { properties });
});

// @desc    Get single property details
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate(
    "owner",
    "fullName phone email businessName"
  );
  if (!property) throw new AppError("Property not found.", 404);

  sendSuccess(res, 200, "Property details fetched.", { property });
});

// @desc    Search & filter approved properties
// @route   GET /api/properties
// @access  Public
// Query params: college, area, propertyType, minRent, maxRent, gender, amenities (csv), maxDistance, page, limit
const searchProperties = asyncHandler(async (req, res) => {
  const {
    college,
    area,
    propertyType,
    minRent,
    maxRent,
    gender,
    amenities,
    maxDistance,
    page = 1,
    limit = 12,
  } = req.query;

  const filter = { status: "approved", isActive: true };

  if (college) filter.nearbyCollege = { $regex: college, $options: "i" };
  if (area) filter["address.area"] = { $regex: area, $options: "i" };
  if (propertyType) filter.propertyType = propertyType;
  if (maxDistance) filter.distanceFromCollege = { $lte: Number(maxDistance) };

  if (minRent || maxRent) {
    filter["pricing.monthlyRent"] = {};
    if (minRent) filter["pricing.monthlyRent"].$gte = Number(minRent);
    if (maxRent) filter["pricing.monthlyRent"].$lte = Number(maxRent);
  }

  if (gender === "boys") filter["rules.boysOnly"] = true;
  if (gender === "girls") filter["rules.girlsOnly"] = true;

  if (amenities) {
    const list = amenities.split(",").map((a) => a.trim());
    list.forEach((amenity) => {
      filter[`amenities.${amenity}`] = true;
    });
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [properties, total] = await Promise.all([
    Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Property.countDocuments(filter),
  ]);

  sendSuccess(res, 200, "Properties fetched.", { properties }, {
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

module.exports = {
  createProperty,
  updateProperty,
  updateAvailability,
  addImages,
  deleteImage,
  deleteProperty,
  getMyProperties,
  getPropertyById,
  searchProperties,
};
