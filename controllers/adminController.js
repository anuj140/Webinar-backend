const { StatusCodes } = require("http-status-codes");
const Admin = require("../models/Admin");
const { BadRequestError, UnauthorizedError, ConflictError } = require("../errors");

// Admin login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Email and password are required");
  }

  // Find admin
  const admin = await Admin.findOne({ email });

  const isPasswordCorrect = await admin.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new UnauthorizedError("Invalid credentials");
  }

  // Generate token
  const token = admin.generateAuthToken();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      token,
    },
  });
};

// Get admin profile
const getProfile = async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    data: req.admin,
  });
};

// Create admin (for setup)
const createAdmin = async (req, res) => {
  const { name, email, password, role = "admin" } = req.body;

  if (!name || !email || !password) {
    throw new BadRequestError("Name, email, and password are required");
  }

  // Check if admin exists
  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new ConflictError("Admin with this email already exists");
  }

  // Create admin
  const admin = await Admin.create({ name, email, password, role });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Admin created successfully",
    data: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
};

// Update admin profile
const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const adminId = req.admin._id;

  // Check if email is already taken by another admin
  if (email) {
    const existingAdmin = await Admin.findOne({
      email: email.toLowerCase(),
      _id: { $ne: adminId },
    });

    if (existingAdmin) {
      throw new ConflictError("Email already in use by another admin");
    }
  }

  const updateData = {};
  if (name) updateData.name = name.trim();
  if (email) updateData.email = email.toLowerCase().trim();

  const admin = await Admin.findByIdAndUpdate(adminId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Profile updated successfully",
    data: admin,
  });
};

// Change password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.admin._id;

  if (!currentPassword || !newPassword) {
    throw new BadRequestError("Current password and new password are required");
  }

  // Get admin with password
  const admin = await Admin.findById(adminId);

  // Verify current password
  const isPasswordCorrect = await admin.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    throw new UnauthorizedError("Current password is incorrect");
  }

  // Update password
  admin.password = newPassword;
  await admin.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Password changed successfully",
  });
};

module.exports = {
  login,
  getProfile,
  createAdmin,
  updateProfile,
  changePassword,
};
