const { StatusCodes } = require("http-status-codes");
const sgMail = require("@sendgrid/mail");
const User = require("../models/User");
const { BadRequestError, NotFoundError, ConflictError } = require("../errors");

// Register user for webinar
const registerUser = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    throw new BadRequestError("Name and email are required");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError("Email already registered for this webinar");
  }

  // Create new user
  const user = await User.create({ name, email });

  sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

  const msg = {
    to: `${email}`,
    from: "anujkumbhar100@gmail.com",
    subject: "Webinar Registration Successful 🎊",
    text: `Hi ${name}, thanks for registering! Webinar Link: https://zoom.us/xyz`,
    html: `<p>Hi <strong>${name}</strong></p>
           <p>Thanks for registering!</p>
           <p><strong>Webinar Link:</strong> <a href="https://zoom.us/xyz">Join Here</a></p>`,
  };

  await sgMail.send(msg);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Successfully registered for webinar",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      registrationDate: user.registrationDate,
      status: user.status,
    },
  });
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    sortBy = "registrationDate",
    sortOrder = "desc",
  } = req.query;

  // Build query
  let query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // Build sort object
  const sortObj = {};
  sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get users
  const users = await User.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(parseInt(limit))
    .select("-__v");

  const total = await User.countDocuments(query);

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit),
      },
      filters: { status, search, sortBy, sortOrder },
    },
  });
};

// Get user by ID
const getUserById = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select("-__v");
  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: user,
  });
};

// Update user status
const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new BadRequestError("Status is required");
  }

  const validStatuses = ["registered", "confirmed", "attended", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  ).select("-__v");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User status updated successfully",
    data: user,
  });
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User deleted successfully",
    data: {
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    },
  });
};

// Delete multiple users (admin only)
const deleteMultipleUsers = async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new BadRequestError("User IDs array is required");
  }

  const result = await User.deleteMany({ _id: { $in: userIds } });

  res.status(StatusCodes.OK).json({
    success: true,
    message: `${result.deletedCount} users deleted successfully`,
    data: {
      deletedCount: result.deletedCount,
    },
  });
};

// Get comprehensive statistics (admin only)
const getStats = async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);
  const thisMonth = new Date(today);
  thisMonth.setMonth(thisMonth.getMonth() - 1);

  // Basic counts
  const total = await User.countDocuments();
  const todayCount = await User.countDocuments({
    registrationDate: { $gte: today },
  });
  const yesterdayCount = await User.countDocuments({
    registrationDate: { $gte: yesterday, $lt: today },
  });
  const thisWeekCount = await User.countDocuments({
    registrationDate: { $gte: thisWeek },
  });
  const thisMonthCount = await User.countDocuments({
    registrationDate: { $gte: thisMonth },
  });

  // Status breakdown
  const byStatus = await User.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  // Daily registrations for the last 30 days
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyRegistrations = await User.aggregate([
    {
      $match: {
        registrationDate: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$registrationDate",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Recent registrations
  const recentRegistrations = await User.find()
    .sort({ registrationDate: -1 })
    .limit(10)
    .select("name email registrationDate status");

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      overview: {
        total,
        today: todayCount,
        yesterday: yesterdayCount,
        thisWeek: thisWeekCount,
        thisMonth: thisMonthCount,
        growth: {
          daily: todayCount - yesterdayCount,
          weekly: thisWeekCount - (total - thisWeekCount),
          monthly: thisMonthCount - (total - thisMonthCount),
        },
      },
      byStatus,
      dailyRegistrations,
      recentRegistrations,
    },
  });
};

// // Get public stats (limited information)
// const getPublicStats = async (req, res) => {
//   const total = await User.countDocuments();
//   const confirmed = await User.countDocuments({ status: "confirmed" });
//   const attended = await User.countDocuments({ status: "attended" });

//   res.status(StatusCodes.OK).json({
//     success: true,
//     data: {
//       totalRegistrations: total,
//       confirmedAttendees: confirmed,
//       actualAttendees: attended,
//     },
//   });
// };

module.exports = {
  registerUser,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  deleteMultipleUsers,
  getStats,
};

// const { StatusCodes } = require("http-status-codes");
// const User = require("../models/User");
// const { BadRequestError, NotFoundError, ConflictError } = require("../errors");
// const EmailService = require("../services/emailService");
// const webinarConfig = require("../config/webinarConfig");
// // const EmailService = require("../services/emailService");
// // const webinarConfig = require("../config/webinarConfig");

// // Initialize email service
// const emailService = new EmailService();

// // Register user for webinar
// const registerUser = async (req, res) => {
//   const { name, email } = req.body;

//   if (!name || !email) {
//     throw new BadRequestError("Name and email are required");
//   }

//   // Check if user already exists
//   const existingUser = await User.findOne({ email });
//   if (existingUser) {
//     throw new ConflictError("Email already registered for this webinar");
//   }

//   // Create new user
//   const user = await User.create({ name, email });

//   // Prepare user details for email
//   const userDetails = {
//     name: user.name,
//     email: user.email,
//     id: user._id,
//   };

//   // Send registration confirmation email
//   try {
//     const emailResult = await emailService.sendRegistrationConfirmation(
//       userDetails,
//       webinarConfig
//     );

//     // Update user record to indicate email was sent
//     await User.findByIdAndUpdate(user._id, {
//       emailSent: true,
//       emailSentAt: new Date(),
//       status: "confirmed",
//     });

//     console.log("Registration confirmation email sent successfully:", emailResult);
//   } catch (emailError) {
//     console.error("Failed to send registration confirmation email:", emailError);
//     // Don't fail the registration if email fails, but log the error
//     // The user is still registered, just without the confirmation email
//   }

//   res.status(StatusCodes.CREATED).json({
//     success: true,
//     message:
//       "Successfully registered for webinar. A confirmation email has been sent to your email address.",
//     data: {
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       registrationDate: user.registrationDate,
//       status: user.status,
//     },
//   });
// };

// // Send reminder emails to all confirmed users
// const sendReminderEmails = async (req, res) => {
//   try {
//     // Get all confirmed users who haven't received a reminder yet
//     const users = await User.find({
//       status: { $in: ["confirmed", "registered"] },
//       reminderSent: false,
//     });

//     if (users.length === 0) {
//       return res.status(StatusCodes.OK).json({
//         success: true,
//         message: "No users found to send reminders to",
//         data: { sentCount: 0 },
//       });
//     }

//     let successCount = 0;
//     let failureCount = 0;
//     const errors = [];

//     // Send reminder emails to all users
//     for (const user of users) {
//       try {
//         const userDetails = {
//           name: user.name,
//           email: user.email,
//           id: user._id,
//         };

//         await emailService.sendWebinarReminder(userDetails, webinarConfig);

//         // Update user record
//         await User.findByIdAndUpdate(user._id, {
//           reminderSent: true,
//           reminderSentAt: new Date(),
//         });

//         successCount++;
//       } catch (error) {
//         console.error(`Failed to send reminder to ${user.email}:`, error);
//         failureCount++;
//         errors.push({
//           email: user.email,
//           error: error.message,
//         });
//       }
//     }

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: `Reminder emails sent. Success: ${successCount}, Failed: ${failureCount}`,
//       data: {
//         sentCount: successCount,
//         failedCount: failureCount,
//         errors: errors,
//       },
//     });
//   } catch (error) {
//     console.error("Error sending reminder emails:", error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: "Failed to send reminder emails",
//       error: error.message,
//     });
//   }
// };

// // Resend confirmation email to a specific user
// const resendConfirmationEmail = async (req, res) => {
//   const { id } = req.params;

//   const user = await User.findById(id);
//   if (!user) {
//     throw new NotFoundError("User not found");
//   }

//   const userDetails = {
//     name: user.name,
//     email: user.email,
//     id: user._id,
//   };

//   try {
//     const emailResult = await emailService.sendRegistrationConfirmation(
//       userDetails,
//       webinarConfig
//     );

//     // Update user record
//     await User.findByIdAndUpdate(user._id, {
//       emailSent: true,
//       emailSentAt: new Date(),
//     });

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Confirmation email resent successfully",
//       data: {
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//         },
//         emailResult,
//       },
//     });
//   } catch (error) {
//     console.error("Failed to resend confirmation email:", error);
//     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: "Failed to resend confirmation email",
//       error: error.message,
//     });
//   }
// };

// // Get all users (admin only)
// const getAllUsers = async (req, res) => {
//   const {
//     page = 1,
//     limit = 10,
//     status,
//     search,
//     sortBy = "registrationDate",
//     sortOrder = "desc",
//   } = req.query;

//   // Build query
//   let query = {};
//   if (status) query.status = status;
//   if (search) {
//     query.$or = [
//       { name: { $regex: search, $options: "i" } },
//       { email: { $regex: search, $options: "i" } },
//     ];
//   }

//   // Build sort object
//   const sortObj = {};
//   sortObj[sortBy] = sortOrder === "desc" ? -1 : 1;

//   // Calculate pagination
//   const skip = (page - 1) * limit;

//   // Get users
//   const users = await User.find(query)
//     .sort(sortObj)
//     .skip(skip)
//     .limit(parseInt(limit))
//     .select("-__v");

//   const total = await User.countDocuments(query);

//   res.status(StatusCodes.OK).json({
//     success: true,
//     data: {
//       users,
//       pagination: {
//         current: parseInt(page),
//         pages: Math.ceil(total / limit),
//         total,
//         limit: parseInt(limit),
//       },
//       filters: { status, search, sortBy, sortOrder },
//     },
//   });
// };

// // Get user by ID
// const getUserById = async (req, res) => {
//   const { id } = req.params;

//   const user = await User.findById(id).select("-__v");
//   if (!user) {
//     throw new NotFoundError("User not found");
//   }

//   res.status(StatusCodes.OK).json({
//     success: true,
//     data: user,
//   });
// };

// // Update user status
// const updateUserStatus = async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;

//   if (!status) {
//     throw new BadRequestError("Status is required");
//   }

//   const validStatuses = ["registered", "confirmed", "attended", "cancelled"];
//   if (!validStatuses.includes(status)) {
//     throw new BadRequestError(`Status must be one of: ${validStatuses.join(", ")}`);
//   }

//   const user = await User.findByIdAndUpdate(
//     id,
//     { status },
//     { new: true, runValidators: true }
//   ).select("-__v");

//   if (!user) {
//     throw new NotFoundError("User not found");
//   }

//   res.status(StatusCodes.OK).json({
//     success: true,
//     message: "User status updated successfully",
//     data: user,
//   });
// };

// // Delete user (admin only)
// const deleteUser = async (req, res) => {
//   const { id } = req.params;

//   const user = await User.findByIdAndDelete(id);
//   if (!user) {
//     throw new NotFoundError("User not found");
//   }

//   res.status(StatusCodes.OK).json({
//     success: true,
//     message: "User deleted successfully",
//     data: {
//       deletedUser: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//       },
//     },
//   });
// };

// // Delete multiple users (admin only)
// const deleteMultipleUsers = async (req, res) => {
//   const { userIds } = req.body;

//   if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
//     throw new BadRequestError("User IDs array is required");
//   }

//   const result = await User.deleteMany({ _id: { $in: userIds } });

//   res.status(StatusCodes.OK).json({
//     success: true,
//     message: `${result.deletedCount} users deleted successfully`,
//     data: {
//       deletedCount: result.deletedCount,
//     },
//   });
// };

// // Get comprehensive statistics (admin only)
// const getStats = async (req, res) => {
//   const now = new Date();
//   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   const yesterday = new Date(today);
//   yesterday.setDate(yesterday.getDate() - 1);
//   const thisWeek = new Date(today);
//   thisWeek.setDate(thisWeek.getDate() - 7);
//   const thisMonth = new Date(today);
//   thisMonth.setMonth(thisMonth.getMonth() - 1);

//   // Basic counts
//   const total = await User.countDocuments();
//   const todayCount = await User.countDocuments({
//     registrationDate: { $gte: today },
//   });
//   const yesterdayCount = await User.countDocuments({
//     registrationDate: { $gte: yesterday, $lt: today },
//   });
//   const thisWeekCount = await User.countDocuments({
//     registrationDate: { $gte: thisWeek },
//   });
//   const thisMonthCount = await User.countDocuments({
//     registrationDate: { $gte: thisMonth },
//   });

//   // Email statistics
//   const emailsSent = await User.countDocuments({ emailSent: true });
//   const remindersSent = await User.countDocuments({ reminderSent: true });

//   // Status breakdown
//   const byStatus = await User.aggregate([
//     { $group: { _id: "$status", count: { $sum: 1 } } },
//   ]);

//   // Daily registrations for the last 30 days
//   const thirtyDaysAgo = new Date(today);
//   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

//   const dailyRegistrations = await User.aggregate([
//     {
//       $match: {
//         registrationDate: { $gte: thirtyDaysAgo },
//       },
//     },
//     {
//       $group: {
//         _id: {
//           $dateToString: {
//             format: "%Y-%m-%d",
//             date: "$registrationDate",
//           },
//         },
//         count: { $sum: 1 },
//       },
//     },
//     { $sort: { _id: 1 } },
//   ]);

//   // Recent registrations
//   const recentRegistrations = await User.find()
//     .sort({ registrationDate: -1 })
//     .limit(10)
//     .select("name email registrationDate status emailSent reminderSent");

//   res.status(StatusCodes.OK).json({
//     success: true,
//     data: {
//       overview: {
//         total,
//         today: todayCount,
//         yesterday: yesterdayCount,
//         thisWeek: thisWeekCount,
//         thisMonth: thisMonthCount,
//         emailsSent,
//         remindersSent,
//         growth: {
//           daily: todayCount - yesterdayCount,
//           weekly: thisWeekCount - (total - thisWeekCount),
//           monthly: thisMonthCount - (total - thisMonthCount),
//         },
//       },
//       byStatus,
//       dailyRegistrations,
//       recentRegistrations,
//     },
//   });
// };

// module.exports = {
//   registerUser,
//   sendReminderEmails,
//   resendConfirmationEmail,
//   getAllUsers,
//   getUserById,
//   updateUserStatus,
//   deleteUser,
//   deleteMultipleUsers,
//   getStats,
// };
