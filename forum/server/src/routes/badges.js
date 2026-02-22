const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const { getBadgeUsers, grantBadge, revokeBadge } = require('../controllers/badgesController');

// Public: get paginated users for a badge
router.get('/:slug/users', getBadgeUsers);

// Admin: grant / revoke a badge
router.post('/:slug/grant', authenticate, adminOnly, grantBadge);
router.delete('/:slug/revoke', authenticate, adminOnly, revokeBadge);

module.exports = router;
