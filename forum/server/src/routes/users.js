const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { uploadAvatar } = require('../middleware/upload');
const { User } = require('../models');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const { Op } = require('sequelize');

const router = express.Router();

// Search users (for @mentions autocomplete)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const users = await User.findAll({
      where: {
        username: { [Op.iLike]: `${q}%` },
        isActive: true,
        isBanned: false,
      },
      attributes: ['id', 'username', 'displayName', 'avatar'],
      limit: 10,
      order: [['username', 'ASC']],
    });
    res.json(users);
  } catch (error) {
    logger.error('Error searching users', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

const validateProfileUpdate = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name cannot exceed 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
];

router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    logger.error('Error fetching user profile', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

router.put('/:id', authenticate, validateProfileUpdate, handleValidationErrors, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Cannot update another user' });
    }

    const { displayName, bio } = req.body;
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;

    await user.save();
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    logger.error('Error updating user profile', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Avatar file upload
router.put('/:id/avatar', authenticate, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Cannot update another user\'s avatar' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete old avatar file if it exists
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldPath = path.join(__dirname, '../..', user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json({ message: 'Avatar updated', user });
  } catch (error) {
    logger.error('Error uploading avatar', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

module.exports = router;
