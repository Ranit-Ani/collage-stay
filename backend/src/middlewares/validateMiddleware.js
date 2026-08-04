const { validationResult } = require("express-validator");

/**
 * Runs an array of express-validator chains, then checks the result.
 * Usage: router.post("/route", validate([...checks]), controller)
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  };
};

module.exports = { validate };
