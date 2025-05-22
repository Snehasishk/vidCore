import { ApiError } from "../utils/api-error.js";
import { validationResult } from "express-validator";
export const validate = async (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => {
    extractedErrors.push({
      [err.path]: err.msg,
    });
  });
  throw new ApiError(422, "Received Data is not Valid", extractedErrors);
};
