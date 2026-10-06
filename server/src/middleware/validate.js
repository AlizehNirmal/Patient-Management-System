// Checks req.body against a zod schema. Invalid bodies become a 400 in the error handler.
module.exports = function validate(schema) {
  return (req, res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };
};
