const { Notification, User } = require('../models');
const logger = require('./logger');

async function createTicketReplyNotification(ticket, reply, replier) {
  try {
    const isStaffReply = reply.isStaff;
    const notifications = [];

    // Ensure we have username/displayName — req.user only has id/email/role
    if (!replier.username) {
      const fullUser = await User.findByPk(replier.id, { attributes: ['id', 'username', 'displayName'] });
      if (fullUser) replier = fullUser;
    }

    if (isStaffReply && ticket.userId !== replier.id) {
      // Staff replied → notify ticket owner
      notifications.push({
        userId: ticket.userId,
        type: 'ticket_reply',
        title: 'Staff Reply on Your Ticket',
        message: `${replier.displayName || replier.username} replied to ticket #${ticket.ticketNumber}`,
        linkUrl: `/support/${ticket.id}`,
        metadata: { ticketId: ticket.id, replyId: reply.id },
      });
    }

    if (!isStaffReply) {
      // User replied → notify assigned staff + all admins/moderators
      const recipientIds = new Set();

      if (ticket.assignedTo && ticket.assignedTo !== replier.id) {
        recipientIds.add(ticket.assignedTo);
      }

      const staff = await User.findAll({
        where: { role: ['admin', 'moderator'], isActive: true },
        attributes: ['id'],
      });
      staff.forEach(s => {
        if (s.id !== replier.id) recipientIds.add(s.id);
      });

      recipientIds.forEach(userId => {
        notifications.push({
          userId,
          type: 'ticket_reply',
          title: 'New Ticket Reply',
          message: `${replier.displayName || replier.username} replied to ticket #${ticket.ticketNumber}`,
          linkUrl: `/support/${ticket.id}`,
          metadata: { ticketId: ticket.id, replyId: reply.id },
        });
      });
    }

    if (notifications.length > 0) {
      await Notification.bulkCreate(notifications);
    }
  } catch (error) {
    logger.error('Error creating ticket reply notification', error);
  }
}

module.exports = { createTicketReplyNotification };
