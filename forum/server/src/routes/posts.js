const express = require('express');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { validateCreatePost, handleValidationErrors } = require('../middleware/validation');
const { postLimiter } = require('../middleware/rateLimiter');
const { Post, User, Product, Category, Comment } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

// Helper: fetch recent unique commenters for a list of posts
const getRecentCommenters = async (postIds, limit = 5) => {
  if (!postIds.length) return {};
  const { sequelize } = require('../models');
  const [rows] = await sequelize.query(`
    SELECT DISTINCT ON (c."postId", c."userId")
      c."postId", u.id, u.username, u.avatar
    FROM "Comments" c
    JOIN "Users" u ON u.id = c."userId"
    WHERE c."postId" IN (:postIds)
    ORDER BY c."postId", c."userId", c."createdAt" DESC
  `, { replacements: { postIds } });

  const grouped = {};
  postIds.forEach(id => { grouped[id] = []; });
  rows.forEach(r => {
    if (grouped[r.postId] && grouped[r.postId].length < limit) {
      grouped[r.postId].push({ id: r.id, username: r.username, avatar: r.avatar });
    }
  });
  return grouped;
};

const generateSlug = (title) => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = crypto.randomBytes(4).toString('hex');
  return `${base}-${suffix}`;
};

// Get all unique tags with counts
router.get('/tags', async (req, res) => {
  try {
    const { productId, categoryId } = req.query;
    const where = { isApproved: true };
    if (productId) where.productId = productId;
    if (categoryId) where.categoryId = categoryId;

    const posts = await Post.findAll({ where, attributes: ['tags'] });
    const tagCounts = {};
    posts.forEach(p => (p.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }));

    const tags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

    res.json(tags);
  } catch (error) {
    logger.error('Error fetching tags', error);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
});

// Search posts
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const searchTerm = `%${q.trim()}%`;

    const posts = await Post.findAndCountAll({
      where: {
        isApproved: true,
        [Op.or]: [
          { title: { [Op.iLike]: searchTerm } },
          { content: { [Op.iLike]: searchTerm } },
        ],
      },
      include: [
        { model: User, attributes: ['id', 'username', 'avatar'] },
        { model: Product, attributes: ['id', 'name', 'color'] },
        { model: Category, attributes: ['id', 'name'] },
      ],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      order: [['createdAt', 'DESC']],
    });

    const postIds = posts.rows.map(p => p.id);
    const participants = await getRecentCommenters(postIds);
    const postsWithParticipants = posts.rows.map(p => {
      const d = p.toJSON();
      d.participants = participants[p.id] || [];
      return d;
    });

    res.json({
      posts: postsWithParticipants,
      total: posts.count,
      pages: Math.ceil(posts.count / parsedLimit),
    });
  } catch (error) {
    logger.error('Error searching posts', error);
    res.status(500).json({ message: 'Failed to search posts' });
  }
});

// List posts
router.get('/', async (req, res) => {
  try {
    const { productId, categoryId, tag, page = 1, limit = 10, sort = 'newest' } = req.query;
    const where = { isApproved: true };
    if (productId) where.productId = productId;
    if (categoryId) where.categoryId = categoryId;
    if (tag) where.tags = { [Op.contains]: [tag] };

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
    const parsedPage = Math.max(parseInt(page) || 1, 1);

    const orderMap = {
      newest: [['isPinned', 'DESC'], ['createdAt', 'DESC']],
      oldest: [['isPinned', 'DESC'], ['createdAt', 'ASC']],
      popular: [['isPinned', 'DESC'], ['views', 'DESC']],
      liked: [['isPinned', 'DESC'], ['likes', 'DESC']],
    };
    const order = orderMap[sort] || orderMap.newest;

    const posts = await Post.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'username', 'avatar'] },
        { model: Product, attributes: ['id', 'name', 'color'] },
        { model: Category, attributes: ['id', 'name', 'color'] },
        { model: Comment, attributes: [] },
      ],
      attributes: {
        include: [
          [require('sequelize').fn('COUNT', require('sequelize').col('Comments.id')), 'replyCount']
        ],
      },
      group: ['Post.id', 'User.id', 'Product.id', 'Category.id'],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      order,
      subQuery: false,
    });

    const count = await Post.count({ where });

    const postIds = posts.rows.map(p => p.id);
    const participants = await getRecentCommenters(postIds);
    const postsWithParticipants = posts.rows.map(p => {
      const d = p.toJSON();
      d.participants = participants[p.id] || [];
      return d;
    });

    res.json({
      posts: postsWithParticipants,
      total: count,
      pages: Math.ceil(count / parsedLimit)
    });
  } catch (error) {
    logger.error('Error fetching posts', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'username', 'avatar', 'reputation'] },
        { model: Product, attributes: ['id', 'name', 'color'] },
        { model: Category, attributes: ['id', 'name', 'color'] },
        { model: Comment, include: [{ model: User, attributes: ['id', 'username', 'avatar'] }] }
      ]
    });

    if (!post) return res.status(404).json({ message: 'Post not found' });

    await Post.increment('views', { where: { id: post.id } });
    post.views += 1;

    res.json(post);
  } catch (error) {
    logger.error('Error fetching post', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});

// Like/unlike post
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    await Post.increment('likes', { where: { id: post.id } });
    res.json({ message: 'Post liked', likes: post.likes + 1 });
  } catch (error) {
    logger.error('Error liking post', error);
    res.status(500).json({ message: 'Failed to like post' });
  }
});

// Create post
router.post('/', authenticate, postLimiter, validateCreatePost, handleValidationErrors, async (req, res) => {
  try {
    const { title, content, productId, categoryId, tags } = req.body;
    const slug = generateSlug(title);

    const post = await Post.create({
      title,
      slug,
      content,
      productId,
      categoryId: categoryId || null,
      userId: req.user.id,
      tags: tags || []
    });

    res.status(201).json({ message: 'Post created', post });
  } catch (error) {
    logger.error('Error creating post', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// Update post
router.put('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot edit this post' });
    }

    const { title, content, tags } = req.body;
    if (title) {
      post.title = title;
      post.slug = generateSlug(title);
    }
    if (content) post.content = content;
    if (tags) post.tags = tags;

    await post.save();
    res.json({ message: 'Post updated', post });
  } catch (error) {
    logger.error('Error updating post', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot delete this post' });
    }

    await post.destroy();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    logger.error('Error deleting post', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

module.exports = router;
