const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, UserBadge } = require('../models');
const logger = require('../utils/logger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.create({
      username,
      email,
      password,
      displayName
    });

    const token = generateToken(user);
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Registration error', error);
    res.status(500).json({ message: 'An error occurred during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned', reason: user.banReason });
    }

    // Fetch and mark-seen any new badges
    let newBadges = [];
    try {
      const newBadgeRecords = await UserBadge.findAll({ where: { userId: user.id, isNew: true } });
      if (newBadgeRecords.length > 0) {
        newBadges = newBadgeRecords.map(r => r.badgeSlug);
        await UserBadge.update({ isNew: false }, { where: { userId: user.id, isNew: true } });
      }
    } catch (_) { /* non-fatal */ }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      newBadges,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
};

module.exports = { register, login, generateToken };
