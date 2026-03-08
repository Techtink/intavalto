const multer = require('multer');
const path = require('path');
const { makeStorage } = require('../utils/storage');

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
  }
};

const uploadBanner = multer({
  storage: makeStorage('banners', 'banner'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadWallpaper = multer({
  storage: makeStorage('wallpapers', 'wallpaper'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadLogo = multer({
  storage: makeStorage('logos', 'logo'),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const uploadAvatar = multer({
  storage: makeStorage('avatars', 'avatar'),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Ticket attachments — local-only for now (can be extended later)
const fs = require('fs');
const ticketDir = path.join(__dirname, '../../uploads/tickets');
if (!fs.existsSync(ticketDir)) fs.mkdirSync(ticketDir, { recursive: true });

const uploadTicketAttachment = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, ticketDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { uploadBanner, uploadWallpaper, uploadLogo, uploadTicketAttachment, uploadAvatar };
