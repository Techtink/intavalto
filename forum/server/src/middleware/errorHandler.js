const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Request error', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  const statusCode = err.status || err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    status: statusCode,
    ...(isDevelopment && { stack: err.stack }),
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
};
