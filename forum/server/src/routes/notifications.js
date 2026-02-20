const express = require('express');
const { authenticate } = require('../middleware/auth');
const { Notification } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

// Get user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 20, unreadOnly } = req.query;
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const notifications = await Notification.findAll({
      where,
      limit: Math.min(parseInt(limit) || 20, 100),
      order: [['createdAt', 'DESC']],
    });
    res.json(notifications);
  } catch (error) {
    logger.error('Error fetching notifications', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    res.json({ count });
  } catch (error) {
    logger.error('Error fetching unread count', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.isRead = true;
    await notification.save();
    res.json({ message: 'Marked as read' });
  } catch (error) {
    logger.error('Error marking notification as read', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// Mark all as read
router.post('/mark-all-read', authenticate, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Error marking all as read', error);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

module.exports = router;
