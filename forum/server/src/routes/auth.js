const express = require('express');
const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin, handleValidationErrors } = require('../middleware/validation');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerLimiter, validateRegister, handleValidationErrors, register);
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, login);

// One-time setup: promotes the authenticated user to admin.
// Only works when NO admin users exist in the database (prevents takeover).
router.post('/setup-admin', authenticate, async (req, res) => {
  try {
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount > 0) {
      return res.status(403).json({ message: 'Setup already complete: an admin already exists' });
    }
    const user = await User.findByPk(req.user.id);
    user.role = 'admin';
    await user.save();
    res.json({ message: 'You have been promoted to admin', role: 'admin' });
  } catch (err) {
    res.status(500).json({ message: 'Setup failed' });
  }
});

module.exports = router;
