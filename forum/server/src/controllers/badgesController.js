const { UserBadge, User } = require('../models');
const logger = require('../utils/logger');

const BADGE_SLUGS = new Set([
  'autobiographer', 'certified', 'editor', 'first-emoji', 'first-flag',
  'first-like', 'first-link', 'first-mention', 'first-onebox', 'first-quote',
  'first-share', 'new-user-of-the-month', 'read-guidelines', 'reader',
  'licensed', 'moderator', 'appreciated', 'enthusiast', 'nice-share',
  'out-of-love', 'promoter', 'solved', 'thank-you', 'welcome',
  'aficionado', 'anniversary', 'campaigner', 'gives-back', 'good-share',
  'guidance-counsellor', 'higher-love', 'respected', 'admired', 'champion',
  'crazy-in-love', 'devotee', 'empathetic', 'great-share', 'know-it-all',
  'solution-institution', 'nice-reply', 'nice-topic', 'popular-link',
  'good-reply', 'good-topic', 'hot-link', 'famous-link', 'great-reply',
  'great-topic', 'basic', 'member', 'regular', 'leader',
]);

// GET /api/badges/:slug/users?page=1&limit=15
const getBadgeUsers = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!BADGE_SLUGS.has(slug)) {
      return res.status(404).json({ message: 'Badge not found' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(30, parseInt(req.query.limit) || 15);
    const offset = (page - 1) * limit;

    const { count, rows } = await UserBadge.findAndCountAll({
      where: { badgeSlug: slug },
      include: [{
        model: User,
        attributes: ['id', 'username', 'displayName', 'avatar'],
      }],
      order: [['grantedAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      hasMore: offset + rows.length < count,
      users: rows.map(ub => ({
        id: ub.User.id,
        username: ub.User.username,
        displayName: ub.User.displayName,
        avatar: ub.User.avatar,
        grantedAt: ub.grantedAt,
      })),
    });
  } catch (err) {
    logger.error('getBadgeUsers error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/badges/:slug/grant — admin only
const grantBadge = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.body;

    if (!BADGE_SLUGS.has(slug)) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [record, created] = await UserBadge.findOrCreate({
      where: { userId, badgeSlug: slug },
      defaults: { userId, badgeSlug: slug, isNew: true },
    });

    res.json({ message: created ? 'Badge granted' : 'Already granted', created });
  } catch (err) {
    logger.error('grantBadge error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/badges/:slug/revoke — admin only
const revokeBadge = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.body;

    const deleted = await UserBadge.destroy({ where: { userId, badgeSlug: slug } });
    res.json({ message: deleted ? 'Badge revoked' : 'Badge not found' });
  } catch (err) {
    logger.error('revokeBadge error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getBadgeUsers, grantBadge, revokeBadge };
