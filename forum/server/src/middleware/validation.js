const express = require('express');
const { body, validationResult } = require('express-validator');

const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and numbers'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name cannot exceed 50 characters'),
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const validateCreatePost = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be 5-200 characters'),
  body('content')
    .trim()
    .isLength({ min: 20, max: 10000 })
    .withMessage('Content must be 20-10000 characters'),
  body('productId')
    .isUUID()
    .withMessage('Invalid product ID'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID'),
  body('tags')
    .optional()
    .isArray()
    .custom((arr) => arr.length <= 10)
    .withMessage('Maximum 10 tags allowed'),
];

const validateCreateProduct = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Product name must be 3-50 characters'),
  body('slug')
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Invalid slug format'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Invalid color format'),
];

const validateCreateCategory = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Category name must be 3-50 characters'),
  body('slug')
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Invalid slug format'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Invalid color format'),
];

const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Comment must be 1-5000 characters'),
  body('postId')
    .isUUID()
    .withMessage('Invalid post ID'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation error',
      errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
    });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCreatePost,
  validateCreateProduct,
  validateCreateCategory,
  validateComment,
  handleValidationErrors,
};
