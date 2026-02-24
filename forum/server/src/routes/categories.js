const express = require('express');
const { authenticate, adminOnly } = require('../middleware/auth');
const { validateCreateCategory, handleValidationErrors } = require('../middleware/validation');
const { Category, Post, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC']]
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekCounts = await Post.findAll({
      attributes: ['categoryId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: { categoryId: { [Op.ne]: null }, createdAt: { [Op.gte]: sevenDaysAgo } },
      group: ['categoryId'],
      raw: true,
    });
    const countMap = {};
    weekCounts.forEach(r => { countMap[r.categoryId] = parseInt(r.count, 10); });

    res.json(categories.map(cat => ({ ...cat.toJSON(), postsThisWeek: countMap[cat.id] || 0 })));
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
