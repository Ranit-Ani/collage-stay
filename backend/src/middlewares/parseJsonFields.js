/**
 * When a form is submitted as multipart/form-data (required for file uploads),
 * nested objects like `address` or `pricing` arrive as JSON strings in req.body
 * instead of parsed objects, because multer does not JSON-parse text fields.
 * This middleware parses a given list of field names back into objects before
 * validation and controller logic run.
 *
 * Usage: router.post("/", upload.array("images"), parseJsonFields(["address", "pricing"]), validate(...), controller)
 */
const parseJsonFields = (fields) => {
  return (req, res, next) => {
    fields.forEach((field) => {
      const value = req.body[field];
      if (typeof value === "string" && value.trim() !== "") {
        try {
          req.body[field] = JSON.parse(value);
        } catch {
          // Leave as-is; downstream validation will report a clear error
        }
      }
    });
    next();
  };
};

module.exports = { parseJsonFields };
