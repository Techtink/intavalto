const express = require('express');
const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin, handleValidationErrors } = require('../middleware/validation');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', registerLimiter, validateRegister, handleValidationErrors, register);
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, login);

module.exports = router;
