const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const UnauthorizedError = require("../errors/unAuthorizedError");

const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Access token required");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      throw new UnauthorizedError("Invalid token - admin not found");
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Invalid or expired token");
    }
    throw error;
  }
};

module.exports = { authenticateAdmin };
