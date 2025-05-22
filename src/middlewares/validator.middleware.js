import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  console.log("Validation errors:", errors.array());
  const extractedErrors = [];
  errors.array().map((err) => {
    extractedErrors.push({
      [err.path]: err.msg,
    });
  });

  throw new ApiError(422, "Received data is not valid", extractedErrors);
};
