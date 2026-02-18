const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { sequelize, User } = require('./models');
const logger = require('./utils/logger');
const { securityHeaders, sanitizeInputs } = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust first proxy (nginx/docker) — required for accurate rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(sanitizeInputs);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/settings', require('./routes/settings'));

// Error handling middleware
app.use((err, req, res, next) => {
  errorHandler(err, req, res, next);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Sync database tables (non-fatal to allow health checks on managed databases)
    try {
      await sequelize.sync();
      logger.info('Database synced');
    } catch (syncErr) {
      logger.warn('Database sync failed (tables may need manual creation):', syncErr.message);
    }

    // Seed admin user if ADMIN_EMAIL and ADMIN_PASSWORD are set
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      try {
        const [admin, created] = await User.findOrCreate({
          where: { email: process.env.ADMIN_EMAIL },
          defaults: {
            username: 'admin',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            role: 'admin',
            displayName: 'Admin',
          },
        });
        if (created) {
          logger.info('Admin user seeded');
        } else {
          if (admin.role !== 'admin') admin.role = 'admin';
          admin.password = process.env.ADMIN_PASSWORD;
          await admin.save();
          logger.info('Admin user updated');
        }
      } catch (seedErr) {
        logger.warn('Admin seed failed:', seedErr.message);
      }
    }

    const server = app.listen(PORT, () => {
      logger.info(`Forum API server running on port ${PORT}`, { environment: process.env.NODE_ENV });
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close(async () => {
        logger.info('HTTP server closed');
        try {
          await sequelize.close();
          logger.info('Database connection closed');
        } catch (err) {
          logger.error('Error closing database connection', err);
        }
        process.exit(0);
      });

      // Force shutdown after 10s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
