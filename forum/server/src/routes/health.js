const express = require('express');
const { sequelize } = require('../models');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// Readiness check
router.get('/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

// Liveness check
router.get('/live', (req, res) => {
  res.json({ alive: true });
});

module.exports = router;
