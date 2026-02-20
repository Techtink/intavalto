const express = require('express');
const { authenticate, adminOnly } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const { uploadBanner, uploadWallpaper, uploadLogo } = require('../middleware/upload');

const router = express.Router();

// Protect all admin routes
router.use(authenticate, adminOnly);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.post('/users/:id/ban', adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);

// Content Moderation
router.get('/posts/unapproved', adminController.getUnapprovedPosts);
router.post('/posts/:id/approve', adminController.approvePost);
router.post('/posts/:id/reject', adminController.rejectPost);

// Ticket Management
router.get('/tickets', adminController.getAllTickets);
router.put('/tickets/:id', adminController.updateTicket);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Site Settings
router.get('/settings', adminController.getSiteSettings);
router.put('/settings', uploadBanner.single('bannerImage'), adminController.updateSiteSettings);
router.put('/settings/wallpaper', uploadWallpaper.single('loginWallpaper'), adminController.updateLoginWallpaper);
router.put('/settings/logo', uploadLogo.single('logo'), adminController.updateLogo);
router.put('/settings/email', adminController.updateEmailSettings);
router.put('/settings/sms', adminController.updateSmsSettings);
router.put('/settings/about', adminController.updateAboutSettings);

module.exports = router;
