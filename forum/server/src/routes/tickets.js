const express = require('express');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { Ticket, TicketReply, User } = require('../models');
const logger = require('../utils/logger');
const { uploadTicketAttachment } = require('../middleware/upload');
const { createTicketReplyNotification } = require('../utils/notificationHelper');

const router = express.Router();

const validateTicket = [
  body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be 5-200 characters'),
  body('description').trim().isLength({ min: 20, max: 5000 }).withMessage('Description must be 20-5000 characters'),
  body('category').isIn(['complaint', 'enquiry', 'bug_report', 'feature_request', 'other']).withMessage('Invalid category'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
];

const validateReply = [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Reply must be 1-5000 characters'),
];

// Get current user's tickets
router.get('/my', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
    const parsedPage = Math.max(parseInt(page) || 1, 1);

    const where = { userId: req.user.id };
    if (status) where.status = status;

    const tickets = await Ticket.findAndCountAll({
      where,
      include: [
        { model: User, as: 'Assignee', attributes: ['id', 'username', 'displayName'] },
      ],
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      tickets: tickets.rows,
      total: tickets.count,
      pages: Math.ceil(tickets.count / parsedLimit),
    });
  } catch (error) {
    logger.error('Error fetching user tickets', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

// Get single ticket (owner or admin)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'username', 'displayName', 'email', 'avatar'] },
        { model: User, as: 'Assignee', attributes: ['id', 'username', 'displayName'] },
        {
          model: TicketReply,
          include: [{ model: User, attributes: ['id', 'username', 'displayName', 'avatar', 'role'] }],
          order: [['createdAt', 'ASC']],
        },
      ],
    });

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // Only ticket owner or admin/moderator can view
    if (ticket.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(ticket);
  } catch (error) {
    logger.error('Error fetching ticket', error);
    res.status(500).json({ message: 'Failed to fetch ticket' });
  }
});

// Create ticket
router.post('/', authenticate, uploadTicketAttachment.array('attachments', 3), validateTicket, handleValidationErrors, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    const attachments = (req.files || []).map(f => `/uploads/tickets/${f.filename}`);

    const ticket = await Ticket.create({
      subject,
      description,
      category,
      priority: priority || 'medium',
      userId: req.user.id,
      attachments,
    });

    res.status(201).json({ message: 'Ticket created', ticket });
  } catch (error) {
    logger.error('Error creating ticket', error);
    res.status(500).json({ message: 'Failed to create ticket' });
  }
});

// Add reply to ticket
router.post('/:id/replies', authenticate, uploadTicketAttachment.array('attachments', 3), validateReply, handleValidationErrors, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (ticket.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'Cannot reply to a closed ticket' });
    }

    const isStaff = req.user.role === 'admin' || req.user.role === 'moderator';
    const attachments = (req.files || []).map(f => `/uploads/tickets/${f.filename}`);

    const reply = await TicketReply.create({
      content: req.body.content,
      ticketId: ticket.id,
      userId: req.user.id,
      isStaff,
      attachments,
    });

    // If staff replies, mark as in_progress
    if (isStaff && ticket.status === 'open') {
      ticket.status = 'in_progress';
      await ticket.save();
    }

    const replyWithUser = await TicketReply.findByPk(reply.id, {
      include: [{ model: User, attributes: ['id', 'username', 'displayName', 'avatar', 'role'] }],
    });

    // Create notifications for ticket reply
    await createTicketReplyNotification(ticket, reply, req.user);

    res.status(201).json({ message: 'Reply added', reply: replyWithUser });
  } catch (error) {
    logger.error('Error adding ticket reply', error);
    res.status(500).json({ message: 'Failed to add reply' });
  }
});

// Close ticket (staff only)
router.post('/:id/close', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ message: 'Only staff can close tickets' });
    }

    ticket.status = 'closed';
    await ticket.save();

    res.json({ message: 'Ticket closed', ticket });
  } catch (error) {
    logger.error('Error closing ticket', error);
    res.status(500).json({ message: 'Failed to close ticket' });
  }
});

// Reopen ticket (owner or staff)
router.post('/:id/reopen', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (ticket.status !== 'closed') {
      return res.status(400).json({ message: 'Ticket is not closed' });
    }

    if (ticket.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ message: 'Access denied' });
    }

    ticket.status = 'open';
    await ticket.save();

    res.json({ message: 'Ticket reopened', ticket });
  } catch (error) {
    logger.error('Error reopening ticket', error);
    res.status(500).json({ message: 'Failed to reopen ticket' });
  }
});

module.exports = router;
