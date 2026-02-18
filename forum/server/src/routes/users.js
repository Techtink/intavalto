const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { User } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

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
  body('avatar')
    .optional()
    .trim()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
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

    const { displayName, bio, avatar } = req.body;
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    logger.error('Error updating user profile', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
