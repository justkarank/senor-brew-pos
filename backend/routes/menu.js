const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');

const VALID_CATEGORIES = ['Coffee', 'Tea', 'Snacks', 'Cold Drinks', 'Other'];

// GET /api/menu — all items (optional ?category= filter)
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      if (!VALID_CATEGORIES.includes(req.query.category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      filter.category = req.query.category;
    }
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/menu/available — only available items
router.get('/available', auth, async (req, res) => {
  try {
    const items = await MenuItem.find({ isAvailable: true }).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/menu — create item
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, price } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Item name is required' });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Valid category is required' });
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: 'Valid price is required' });
    }

    const item = new MenuItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/menu/:id — update item
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/menu/:id — delete item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
