const BadRequestError = require("./bad-request");
const ConflictError = require("./conflict-request");
const CustomError = require("./custom-api");
const NotFoundError = require("./not-found");
const UnauthorizedError = require("./unAuthorizedError");

module.exports = {
  BadRequestError,
  ConflictError,
  CustomError,
  NotFoundError,
  UnauthorizedError,
};
