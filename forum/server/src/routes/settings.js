const express = require('express');
const { SiteSettings } = require('../models');
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

module.exports = router;
