const { body } = require("express-validator");

const createBookingValidator = [
  body("propertyId").notEmpty().withMessage("propertyId is required").isMongoId().withMessage("Invalid propertyId"),
  body("message").optional().isLength({ max: 500 }).withMessage("Message is too long"),
  body("moveInDate").optional({ values: "falsy" }).isISO8601().withMessage("Invalid move-in date").toDate(),
];

const optionalReasonValidator = [
  body("reason").optional().trim().isLength({ max: 300 }).withMessage("Reason is too long"),
];

const requiredReasonValidator = [
  body("reason").trim().notEmpty().withMessage("A reason is required").isLength({ max: 300 }).withMessage("Reason is too long"),
];

const offlineSubmitValidator = [
  body("note")
    .trim()
    .notEmpty()
    .withMessage("Please describe how you paid (method, reference number, date, etc.)")
    .isLength({ max: 500 })
    .withMessage("Note is too long"),
];

const offlineVerifyValidator = [
  body("approve").isBoolean().withMessage("approve must be true or false").toBoolean(),
  body("reason").optional().trim().isLength({ max: 300 }).withMessage("Reason is too long"),
];

const onlineVerifyValidator = [
  body("success").isBoolean().withMessage("success must be true or false").toBoolean(),
  body("transactionId").optional().trim().isLength({ max: 100 }),
];

module.exports = {
  createBookingValidator,
  optionalReasonValidator,
  requiredReasonValidator,
  offlineSubmitValidator,
  offlineVerifyValidator,
  onlineVerifyValidator,
};
