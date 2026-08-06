const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    propertyName: { type: String, required: true, trim: true },
    propertyType: {
      type: String,
      enum: [
        "Hostel",
        "Boys PG",
        "Girls PG",
        "Shared Room",
        "Single Room",
        "Flat",
        "Apartment",
        "Mess",
      ],
      required: true,
    },

    contactNumber: { type: String, required: true },
    email: { type: String, required: true },

    address: {
      fullAddress: { type: String, required: true },
      area: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    nearbyCollege: { type: String, default: "" },
    distanceFromCollege: { type: Number, default: 0 }, // in km

    pricing: {
      monthlyRent: { type: Number, required: true },
      securityDeposit: { type: Number, default: 0 },
      electricityCharges: { type: Number, default: 0 },
      waterCharges: { type: Number, default: 0 },
      internetCharges: { type: Number, default: 0 },
    },

    availability: {
      totalSeats: { type: Number, required: true, default: 1 },
      occupiedSeats: { type: Number, default: 0 },
    },

    amenities: {
      wifi: { type: Boolean, default: false },
      attachedBathroom: { type: Boolean, default: false },
      commonBathroom: { type: Boolean, default: false },
      bed: { type: Boolean, default: false },
      fan: { type: Boolean, default: false },
      table: { type: Boolean, default: false },
      chair: { type: Boolean, default: false },
      wardrobe: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      cctv: { type: Boolean, default: false },
    },

    rules: {
      boysOnly: { type: Boolean, default: false },
      girlsOnly: { type: Boolean, default: false },
      visitorsAllowed: { type: Boolean, default: false },
      smokingAllowed: { type: Boolean, default: false },
    },

    // Mess-specific fields (only relevant when propertyType === "Mess")
    messDetails: {
      monthlyCharge: { type: Number },
      breakfast: { type: Boolean, default: false },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false },
      foodType: { type: String, enum: ["Veg", "Non-Veg", "Both"], default: "Veg" },
      mealTiming: { type: String, default: "" },
    },

    images: [
      {
        url: String,
        publicId: String,
      },
    ],

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, default: "" },

    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

propertySchema.virtual("availableSeats").get(function () {
  return Math.max(this.availability.totalSeats - this.availability.occupiedSeats, 0);
});

propertySchema.virtual("isFullyOccupied").get(function () {
  return this.availability.totalSeats - this.availability.occupiedSeats <= 0;
});

propertySchema.set("toJSON", { virtuals: true });
propertySchema.set("toObject", { virtuals: true });

propertySchema.index({ "address.city": 1, propertyType: 1 });
propertySchema.index({ propertyName: "text", "address.area": "text" });

module.exports = mongoose.model("Property", propertySchema);
