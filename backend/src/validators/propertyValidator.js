const { body } = require("express-validator");

const propertyTypes = [
  "Hostel",
  "Boys PG",
  "Girls PG",
  "Shared Room",
  "Single Room",
  "Flat",
  "Apartment",
  "Mess",
];

const createPropertyValidator = [
  body("propertyName").trim().notEmpty().withMessage("Property name is required"),
  body("propertyType")
    .isIn(propertyTypes)
    .withMessage("Invalid property type"),
  body("contactNumber").trim().notEmpty().withMessage("Contact number is required"),
  body("email").isEmail().withMessage("A valid email is required"),
  body("address.fullAddress").notEmpty().withMessage("Full address is required"),
  body("address.area").notEmpty().withMessage("Area is required"),
  body("address.city").notEmpty().withMessage("City is required"),
  body("pricing.monthlyRent")
    .isFloat({ min: 0 })
    .withMessage("Monthly rent must be a positive number"),
  body("availability.totalSeats")
    .isInt({ min: 1 })
    .withMessage("Total seats must be at least 1"),
];

const reviewValidator = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().isLength({ max: 1000 }).withMessage("Comment too long"),
];

module.exports = { createPropertyValidator, reviewValidator };
