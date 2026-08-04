const Notification = require("../models/Notification");
const asyncHandler = require("../middlewares/asyncHandler");
const { AppError } = require("../middlewares/errorMiddleware");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Get notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  sendSuccess(res, 200, "Notifications fetched.", { notifications, unreadCount });
});

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new AppError("Notification not found.", 404);
  if (notification.recipient.toString() !== req.user._id.toString()) {
    throw new AppError("You are not authorized to modify this notification.", 403);
  }

  notification.isRead = true;
  await notification.save();

  sendSuccess(res, 200, "Notification marked as read.", { notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  sendSuccess(res, 200, "All notifications marked as read.");
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
