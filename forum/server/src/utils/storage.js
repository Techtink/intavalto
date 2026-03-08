const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');
const path = require('path');

// DO Spaces / S3 storage is enabled when these env vars are set
const useSpaces = !!(
  process.env.DO_SPACES_KEY &&
  process.env.DO_SPACES_SECRET &&
  process.env.DO_SPACES_BUCKET &&
  process.env.DO_SPACES_ENDPOINT
);

let s3Client = null;
if (useSpaces) {
  s3Client = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: process.env.DO_SPACES_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET,
    },
  });
}

/**
 * Creates a multer storage engine.
 * - If DO Spaces is configured: uploads to Spaces and returns a public HTTPS URL.
 * - Otherwise: saves to local disk under uploads/<folder>/.
 *
 * @param {string} folder  Sub-folder name, e.g. 'banners', 'logos', 'avatars'
 * @param {string} prefix  Filename prefix, e.g. 'banner', 'logo'
 */
function makeStorage(folder, prefix) {
  if (useSpaces) {
    return multerS3({
      s3: s3Client,
      bucket: process.env.DO_SPACES_BUCKET,
      acl: 'public-read',
      key: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${folder}/${prefix}-${Date.now()}${ext}`);
      },
    });
  }

  // Local disk fallback
  const fs = require('fs');
  const multer = require('multer');
  const dir = path.join(__dirname, '../../uploads', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${prefix}-${Date.now()}${ext}`);
    },
  });
}

/**
 * Returns the public URL for an uploaded file.
 * - S3/Spaces: the file object has `.location` with the full URL.
 * - Local disk: returns the relative path like `/uploads/<folder>/<filename>`.
 */
function getFileUrl(file, folder) {
  if (useSpaces && file.location) return file.location;
  return `/uploads/${folder}/${file.filename}`;
}

module.exports = { makeStorage, getFileUrl, useSpaces };
