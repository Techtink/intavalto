const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateComment, handleValidationErrors } = require('../middleware/validation');
const { Comment, Post, User } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { postId: req.params.postId, isApproved: true },
      include: [{ model: User, attributes: ['id', 'username', 'avatar', 'reputation'] }],
      order: [['likes', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(comments);
  } catch (error) {
    logger.error('Error fetching comments', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

router.post('/', authenticate, validateComment, handleValidationErrors, async (req, res) => {
  try {
    const { content, postId } = req.body;

    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.isLocked) {
      return res.status(403).json({ message: 'This post is locked' });
    }

    const comment = await Comment.create({
      content,
      postId,
      userId: req.user.id
    });

    res.status(201).json({ message: 'Comment created', comment });
  } catch (error) {
    logger.error('Error creating comment', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot edit this comment' });
    }

    const { content } = req.body;
    if (content) comment.content = content;

    await comment.save();
    res.json({ message: 'Comment updated', comment });
  } catch (error) {
    logger.error('Error updating comment', error);
    res.status(500).json({ message: 'Failed to update comment' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot delete this comment' });
    }

    await comment.destroy();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    logger.error('Error deleting comment', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

module.exports = router;
