const express = require('express');
const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin, handleValidationErrors } = require('../middleware/validation');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerLimiter, validateRegister, handleValidationErrors, register);
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, login);

// One-time setup: promotes the calling user to admin and unbans them.
// Only works when no active (non-banned) admin exists — prevents hostile takeover.
router.post('/setup-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password required' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Only proceed if no active admin exists
    const activeAdminCount = await User.count({ where: { role: 'admin', isBanned: false } });
    if (activeAdminCount > 0) {
      return res.status(403).json({ message: 'Setup already complete: an active admin already exists' });
    }
    user.role = 'admin';
    user.isBanned = false;
    user.banReason = null;
    await user.save();
    res.json({ message: 'Account promoted to admin and unbanned', role: 'admin' });
  } catch (err) {
    res.status(500).json({ message: 'Setup failed' });
  }
});

module.exports = router;
