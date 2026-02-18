const express = require('express');
const { authenticate, adminOnly } = require('../middleware/auth');
const { validateCreateCategory, handleValidationErrors } = require('../middleware/validation');
const { Category } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    logger.error('Error fetching categories', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

router.post('/', authenticate, adminOnly, validateCreateCategory, handleValidationErrors, async (req, res) => {
  try {
    const { name, slug, description, icon, color } = req.body;

    const category = await Category.create({
      name,
      slug,
      description,
      icon,
      color
    });

    res.status(201).json({ message: 'Category created', category });
  } catch (error) {
    logger.error('Error creating category', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const { name, description, icon, color, displayOrder, isActive } = req.body;

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (color) category.color = color;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json({ message: 'Category updated', category });
  } catch (error) {
    logger.error('Error updating category', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await category.destroy();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    logger.error('Error deleting category', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

module.exports = router;
