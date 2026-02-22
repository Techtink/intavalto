const express = require('express');
const { SiteSettings, User, Post, Comment } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Public endpoint — returns banner data (no auth required)
router.get('/banner', async (req, res) => {
  try {
    const settings = await SiteSettings.findOne({
      attributes: ['bannerEnabled', 'bannerImageUrl', 'bannerTitle', 'bannerSubtitle'],
    });
    if (!settings || !settings.bannerEnabled) {
      return res.json({ bannerEnabled: false });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch banner settings' });
  }
});

// Public endpoint — returns login wallpaper (no auth required)
router.get('/login', async (req, res) => {
  try {
    const settings = await SiteSettings.findOne({
      attributes: ['loginWallpaperUrl'],
    });
    res.json({ loginWallpaperUrl: settings?.loginWallpaperUrl || null });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch login settings' });
  }
});

// Public endpoint — returns logo URL (no auth required)
router.get('/logo', async (req, res) => {
  try {
    const settings = await SiteSettings.findOne({
      attributes: ['logoUrl'],
    });
    res.json({ logoUrl: settings?.logoUrl || null });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch logo' });
  }
});

// Public endpoint — returns forum stats for About page (no auth required)
router.get('/about', async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      totalPosts,
      totalComments,
      admins,
      moderators,
      postsThisWeek,
      postsToday,
      newMembersThisWeek,
    ] = await Promise.all([
      User.count(),
      Post.count(),
      Comment.count(),
      User.findAll({ where: { role: 'admin' }, attributes: ['id', 'username', 'displayName', 'avatar', 'createdAt'] }),
      User.findAll({ where: { role: 'moderator' }, attributes: ['id', 'username', 'displayName', 'avatar', 'createdAt'] }),
      Post.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
      Post.count({ where: { createdAt: { [Op.gte]: oneDayAgo } } }),
      User.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
    ]);

    // Fetch settings separately with fallback — new columns may not exist in DB yet
    let settings = null;
    try {
      settings = await SiteSettings.findOne();
    } catch (e) {
      try {
        settings = await SiteSettings.findOne({
          attributes: ['id', 'createdAt', 'aboutForumName', 'aboutForumDescription', 'aboutContactText', 'aboutContactEmail'],
        });
      } catch (e2) { /* proceed with null settings */ }
    }

    res.json({
      totalMembers,
      totalPosts,
      totalComments,
      admins,
      moderators,
      postsThisWeek,
      postsToday,
      newMembersThisWeek,
      forumCreatedAt: settings?.createdAt || null,
      aboutForumName: settings?.aboutForumName || null,
      aboutForumDescription: settings?.aboutForumDescription || null,
      aboutContactText: settings?.aboutContactText || null,
      aboutContactEmail: settings?.aboutContactEmail || null,
      faqContent: settings?.faqContent || null,
      termsContent: settings?.termsContent || null,
      privacyContent: settings?.privacyContent || null,
      conditionsContent: settings?.conditionsContent || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch about stats' });
  }
});

module.exports = router;
