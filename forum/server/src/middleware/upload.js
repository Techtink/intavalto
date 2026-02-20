const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/banners');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `banner-${Date.now()}${ext}`);
  },
});

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
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Login wallpaper upload
const loginWallpaperDir = path.join(__dirname, '../../uploads/wallpapers');
if (!fs.existsSync(loginWallpaperDir)) {
  fs.mkdirSync(loginWallpaperDir, { recursive: true });
}

const wallpaperStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, loginWallpaperDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `wallpaper-${Date.now()}${ext}`);
  },
});

const uploadWallpaper = multer({
  storage: wallpaperStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Logo upload
const logoDir = path.join(__dirname, '../../uploads/logos');
if (!fs.existsSync(logoDir)) {
  fs.mkdirSync(logoDir, { recursive: true });
}

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logoDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const uploadLogo = multer({
  storage: logoStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});

// Ticket attachment upload
const ticketDir = path.join(__dirname, '../../uploads/tickets');
if (!fs.existsSync(ticketDir)) {
  fs.mkdirSync(ticketDir, { recursive: true });
}

const ticketStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ticketDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const uploadTicketAttachment = multer({
  storage: ticketStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
});

// Avatar upload
const avatarDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.params.id}-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});

module.exports = { uploadBanner, uploadWallpaper, uploadLogo, uploadTicketAttachment, uploadAvatar };
