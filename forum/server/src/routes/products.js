const express = require('express');
const { authenticate, adminOnly } = require('../middleware/auth');
const { validateCreateProduct, handleValidationErrors } = require('../middleware/validation');
const { Product } = require('../models');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC']]
    });
    res.json(products);
  } catch (error) {
    logger.error('Error fetching products', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

router.post('/', authenticate, adminOnly, validateCreateProduct, handleValidationErrors, async (req, res) => {
  try {
    const { name, slug, description, icon, color } = req.body;
    const product = await Product.create({ name, slug, description, icon, color });
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    logger.error('Error creating product', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, description, icon, color, displayOrder, isActive } = req.body;
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (icon !== undefined) product.icon = icon;
    if (color) product.color = color;
    if (displayOrder !== undefined) product.displayOrder = displayOrder;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();
    res.json({ message: 'Product updated', product });
  } catch (error) {
    logger.error('Error updating product', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    logger.error('Error deleting product', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

module.exports = router;
