const { User, Post, Comment, Product, Category, Ticket, TicketReply, SiteSettings } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const safeUserFields = ['id', 'username', 'email', 'displayName', 'bio', 'avatar', 'role', 'isActive', 'isBanned', 'banReason', 'reputation', 'createdAt', 'updatedAt'];

// User Management
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isBanned } = req.query;
    const where = {};
    if (role) where.role = role;
    if (isBanned !== undefined) where.isBanned = isBanned === 'true';

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
    const parsedPage = Math.max(parseInt(page) || 1, 1);

    const users = await User.findAndCountAll({
      where,
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: users.rows,
      total: users.count,
      pages: Math.ceil(users.count / parsedLimit)
    });
  } catch (error) {
    logger.error('Error fetching users', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    logger.error('Error fetching user', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { role, isBanned, banReason } = req.body;
    const user = await User.findByPk(req.params.id, {
      attributes: safeUserFields
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (role) user.role = role;
    if (isBanned !== undefined) {
      user.isBanned = isBanned;
      if (isBanned) user.banReason = banReason;
    }

    await user.save();
    res.json({ message: 'User updated', user });
  } catch (error) {
    logger.error('Error updating user', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

const banUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByPk(req.params.id, {
      attributes: safeUserFields
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = true;
    user.banReason = reason;
    await user.save();

    res.json({ message: 'User banned', user });
  } catch (error) {
    logger.error('Error banning user', error);
    res.status(500).json({ message: 'Failed to ban user' });
  }
};

const unbanUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: safeUserFields
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = false;
    user.banReason = null;
    await user.save();

    res.json({ message: 'User unbanned', user });
  } catch (error) {
    logger.error('Error unbanning user', error);
    res.status(500).json({ message: 'Failed to unban user' });
  }
};

// Content Moderation
const getUnapprovedPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { isApproved: false },
      include: [
        { model: User, attributes: ['username', 'email'] },
        { model: Product, attributes: ['id', 'name'] },
        { model: Category, attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(posts);
  } catch (error) {
    logger.error('Error fetching unapproved posts', error);
    res.status(500).json({ message: 'Failed to fetch unapproved posts' });
  }
};

const approvePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.isApproved = true;
    await post.save();
    res.json({ message: 'Post approved', post });
  } catch (error) {
    logger.error('Error approving post', error);
    res.status(500).json({ message: 'Failed to approve post' });
  }
};

const rejectPost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await post.destroy();
    res.json({ message: 'Post rejected and deleted' });
  } catch (error) {
    logger.error('Error rejecting post', error);
    res.status(500).json({ message: 'Failed to reject post' });
  }
};

// Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalPosts, totalComments, totalProducts, totalCategories, bannedUsers, unapprovedPosts, openTickets, totalTickets] = await Promise.all([
      User.count(),
      Post.count(),
      Comment.count(),
      Product.count(),
      Category.count(),
      User.count({ where: { isBanned: true } }),
      Post.count({ where: { isApproved: false } }),
      Ticket.count({ where: { status: ['open', 'in_progress'] } }),
      Ticket.count(),
    ]);

    res.json({
      totalUsers,
      totalPosts,
      totalComments,
      totalProducts,
      totalCategories,
      bannedUsers,
      unapprovedPosts,
      openTickets,
      totalTickets,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// Ticket Management
const getAllTickets = async (req, res) => {
  try {
    const { page = 1, limit = 15, status, priority, category } = req.query;
    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 15, 1), 100);
    const parsedPage = Math.max(parseInt(page) || 1, 1);

    const tickets = await Ticket.findAndCountAll({
      where,
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'username', 'displayName', 'email'] },
        { model: User, as: 'Assignee', attributes: ['id', 'username', 'displayName'] },
      ],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      order: [
        [require('sequelize').literal("CASE WHEN status = 'open' THEN 0 WHEN status = 'in_progress' THEN 1 WHEN status = 'resolved' THEN 2 ELSE 3 END"), 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });

    res.json({
      tickets: tickets.rows,
      total: tickets.count,
      pages: Math.ceil(tickets.count / parsedLimit),
    });
  } catch (error) {
    logger.error('Error fetching tickets', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
};

const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const { status, priority, assignedTo } = req.body;
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;

    await ticket.save();
    res.json({ message: 'Ticket updated', ticket });
  } catch (error) {
    logger.error('Error updating ticket', error);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
};

// Site Settings
const getSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    const settingsJson = settings.toJSON();
    if (settingsJson.smtpPassword) settingsJson.smtpPassword = '********';
    if (settingsJson.termiiApiKey) settingsJson.termiiApiKey = '********';
    res.json(settingsJson);
  } catch (error) {
    logger.error('Error fetching site settings', error);
    res.status(500).json({ message: 'Failed to fetch site settings' });
  }
};

const updateSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    const { bannerEnabled, bannerTitle, bannerSubtitle } = req.body;

    if (bannerEnabled !== undefined) {
      settings.bannerEnabled = bannerEnabled === 'true' || bannerEnabled === true;
    }
    if (bannerTitle !== undefined) settings.bannerTitle = bannerTitle;
    if (bannerSubtitle !== undefined) settings.bannerSubtitle = bannerSubtitle;

    // Handle file upload
    if (req.file) {
      // Delete old banner file if it exists
      if (settings.bannerImageUrl) {
        const oldPath = path.join(__dirname, '../..', settings.bannerImageUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      settings.bannerImageUrl = `/uploads/banners/${req.file.filename}`;
    }

    await settings.save();
    res.json({ message: 'Settings updated', settings });
  } catch (error) {
    logger.error('Error updating site settings', error);
    res.status(500).json({ message: 'Failed to update site settings' });
  }
};

const updateLoginWallpaper = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    if (req.file) {
      // Delete old wallpaper file if it exists
      if (settings.loginWallpaperUrl) {
        const oldPath = path.join(__dirname, '../..', settings.loginWallpaperUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      settings.loginWallpaperUrl = `/uploads/wallpapers/${req.file.filename}`;
      await settings.save();
    }

    res.json({ message: 'Login wallpaper updated', settings });
  } catch (error) {
    logger.error('Error updating login wallpaper', error);
    res.status(500).json({ message: 'Failed to update login wallpaper' });
  }
};

const updateEmailSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    const { smtpHost, smtpPort, smtpUser, smtpPassword, emailFromAddress, emailFromName } = req.body;

    if (smtpHost !== undefined) settings.smtpHost = smtpHost;
    if (smtpPort !== undefined) settings.smtpPort = smtpPort ? parseInt(smtpPort, 10) : null;
    if (smtpUser !== undefined) settings.smtpUser = smtpUser;
    if (smtpPassword !== undefined && smtpPassword !== '********') {
      settings.smtpPassword = smtpPassword;
    }
    if (emailFromAddress !== undefined) settings.emailFromAddress = emailFromAddress;
    if (emailFromName !== undefined) settings.emailFromName = emailFromName;

    await settings.save();

    const settingsJson = settings.toJSON();
    if (settingsJson.smtpPassword) settingsJson.smtpPassword = '********';
    if (settingsJson.termiiApiKey) settingsJson.termiiApiKey = '********';
    res.json({ message: 'Email settings updated', settings: settingsJson });
  } catch (error) {
    logger.error('Error updating email settings', error);
    res.status(500).json({ message: 'Failed to update email settings' });
  }
};

const updateSmsSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    const { termiiApiKey, termiiSenderId } = req.body;

    if (termiiApiKey !== undefined && termiiApiKey !== '********') {
      settings.termiiApiKey = termiiApiKey;
    }
    if (termiiSenderId !== undefined) settings.termiiSenderId = termiiSenderId;

    await settings.save();

    const settingsJson = settings.toJSON();
    if (settingsJson.smtpPassword) settingsJson.smtpPassword = '********';
    if (settingsJson.termiiApiKey) settingsJson.termiiApiKey = '********';
    res.json({ message: 'SMS settings updated', settings: settingsJson });
  } catch (error) {
    logger.error('Error updating SMS settings', error);
    res.status(500).json({ message: 'Failed to update SMS settings' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  banUser,
  unbanUser,
  getUnapprovedPosts,
  approvePost,
  rejectPost,
  getDashboardStats,
  getAllTickets,
  updateTicket,
  getSiteSettings,
  updateSiteSettings,
  updateLoginWallpaper,
  updateEmailSettings,
  updateSmsSettings,
};
