const { UserBadge, Notification, User, Post, Comment } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const logger = require('./logger');

/**
 * Try to grant a badge to a user. No-ops if already held.
 * Creates a notification when a new badge is awarded.
 * Returns true if badge was newly granted, false otherwise.
 */
async function tryAward(userId, badgeSlug, badgeName) {
  try {
    const [, created] = await UserBadge.findOrCreate({
      where: { userId, badgeSlug },
      defaults: { userId, badgeSlug },
    });
    if (created) {
      await Notification.create({
        userId,
        type: 'badge_earned',
        title: 'Badge Earned!',
        message: `You earned the "${badgeName}" badge!`,
        linkUrl: `/badges/${badgeSlug}`,
        metadata: { badgeSlug },
      });
      logger.info(`Badge "${badgeSlug}" awarded to user ${userId}`);
    }
    return created;
  } catch (error) {
    // Unique constraint race — another request already granted it
    if (error.name === 'SequelizeUniqueConstraintError') return false;
    logger.error(`Error awarding badge "${badgeSlug}"`, error);
    return false;
  }
}

// ── Trigger: profile updated ──────────────────────────────────────
async function checkAutobiographer(userId) {
  const user = await User.findByPk(userId, {
    attributes: ['displayName', 'bio', 'avatar', 'location'],
  });
  if (!user) return;
  // Profile is "filled out" when at least displayName + bio are set
  if (user.displayName && user.bio) {
    await tryAward(userId, 'autobiographer', 'Autobiographer');
  }
}

// ── Trigger: post or comment created ──────────────────────────────
async function checkFirstEmoji(userId, content) {
  // Common emoji pattern: unicode emoji ranges or :emoji: shortcodes
  const emojiRegex = /[\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u;
  if (emojiRegex.test(content)) {
    await tryAward(userId, 'first-emoji', 'First Emoji');
  }
}

async function checkFirstMention(userId, content) {
  // Matches @username patterns
  if (/@\w+/.test(content)) {
    await tryAward(userId, 'first-mention', 'First Mention');
  }
}

async function checkFirstLink(userId, content) {
  if (/https?:\/\/\S+/.test(content)) {
    await tryAward(userId, 'first-link', 'First Link');
  }
}

async function checkFirstQuote(userId, content) {
  // Markdown blockquote
  if (/^>\s/m.test(content) || /\[quote\]/i.test(content)) {
    await tryAward(userId, 'first-quote', 'First Quote');
  }
}

// ── Trigger: post liked ───────────────────────────────────────────
async function checkLikeBadges(likerUserId, post) {
  // Liker gets "First Like"
  await tryAward(likerUserId, 'first-like', 'First Like');

  // Post author gets "Welcome" (received a like)
  if (post.userId !== likerUserId) {
    await tryAward(post.userId, 'welcome', 'Welcome');
  }

  // Check like milestones on the post (after increment)
  const updatedPost = await Post.findByPk(post.id, { attributes: ['likes', 'userId'] });
  if (!updatedPost) return;
  const likes = updatedPost.likes;

  if (likes >= 10) await tryAward(updatedPost.userId, 'nice-topic', 'Nice Topic');
  if (likes >= 25) await tryAward(updatedPost.userId, 'good-topic', 'Good Topic');
  if (likes >= 50) await tryAward(updatedPost.userId, 'great-topic', 'Great Topic');

  // Check "appreciated": received 1+ like on 20+ posts
  const postsWithLikes = await Post.count({
    where: { userId: post.userId, likes: { [Op.gte]: 1 } },
  });
  if (postsWithLikes >= 20) {
    await tryAward(post.userId, 'appreciated', 'Appreciated');
  }

  // Check "respected": received 2+ likes on 100+ posts
  const postsWithTwoLikes = await Post.count({
    where: { userId: post.userId, likes: { [Op.gte]: 2 } },
  });
  if (postsWithTwoLikes >= 100) {
    await tryAward(post.userId, 'respected', 'Respected');
  }

  // Check "admired": received 5+ likes on 300+ posts
  const postsWithFiveLikes = await Post.count({
    where: { userId: post.userId, likes: { [Op.gte]: 5 } },
  });
  if (postsWithFiveLikes >= 300) {
    await tryAward(post.userId, 'admired', 'Admired');
  }
}

// ── Trigger: comment liked ────────────────────────────────────────
async function checkCommentLikeBadges(likerUserId, comment) {
  // Liker gets "First Like"
  await tryAward(likerUserId, 'first-like', 'First Like');

  // Comment author gets "Welcome"
  if (comment.userId !== likerUserId) {
    await tryAward(comment.userId, 'welcome', 'Welcome');
  }

  // Check like milestones on reply
  const updatedComment = await Comment.findByPk(comment.id, { attributes: ['likes', 'userId'] });
  if (!updatedComment) return;
  const likes = updatedComment.likes;

  if (likes >= 10) await tryAward(updatedComment.userId, 'nice-reply', 'Nice Reply');
  if (likes >= 25) await tryAward(updatedComment.userId, 'good-reply', 'Good Reply');
  if (likes >= 50) await tryAward(updatedComment.userId, 'great-reply', 'Great Reply');
}

// ── Trigger: user account age ─────────────────────────────────────
async function checkAnniversary(userId) {
  const user = await User.findByPk(userId, { attributes: ['createdAt'] });
  if (!user) return;
  const ageMs = Date.now() - new Date(user.createdAt).getTime();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (ageMs >= oneYear) {
    // Must have at least one post
    const postCount = await Post.count({ where: { userId } });
    if (postCount >= 1) {
      await tryAward(userId, 'anniversary', 'Anniversary');
    }
  }
}

// ── Trigger: on login — run lightweight checks ────────────────────
async function checkOnLogin(userId) {
  await checkAutobiographer(userId);
  await checkAnniversary(userId);
}

// ── Trigger: content created (post or comment) ────────────────────
async function checkOnContentCreated(userId, content) {
  // Run content-based badge checks in parallel
  await Promise.all([
    checkFirstEmoji(userId, content),
    checkFirstMention(userId, content),
    checkFirstLink(userId, content),
    checkFirstQuote(userId, content),
  ]);
}

module.exports = {
  tryAward,
  checkAutobiographer,
  checkLikeBadges,
  checkCommentLikeBadges,
  checkOnLogin,
  checkOnContentCreated,
};
