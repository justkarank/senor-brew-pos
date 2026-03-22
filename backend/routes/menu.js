const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { requireAuth, allowRoles } = require('../middleware/auth');

const VALID_CATEGORIES = ['Coffee', 'Tea', 'Snacks', 'Cold Drinks', 'Other'];
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const parsePrice = (value) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw createHttpError(400, 'Valid price is required.');
  }

  return parsedValue;
};

const parseStockQuantity = (value) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw createHttpError(400, 'Stock quantity must be a whole number 0 or greater.');
  }

  return parsedValue;
};

const buildMenuPayload = (body, existingItem = null) => {
  const payload = {};

  if (hasOwn(body, 'name')) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      throw createHttpError(400, 'Item name is required.');
    }

    payload.name = body.name.trim();
  }

  if (hasOwn(body, 'category')) {
    if (!VALID_CATEGORIES.includes(body.category)) {
      throw createHttpError(400, 'Valid category is required.');
    }

    payload.category = body.category;
  }

  if (hasOwn(body, 'price')) {
    payload.price = parsePrice(body.price);
  }

  const stockProvided = hasOwn(body, 'stockQuantity');
  const availabilityProvided = hasOwn(body, 'isAvailable');

  if (stockProvided) {
    payload.stockQuantity = parseStockQuantity(body.stockQuantity);
  }

  if (availabilityProvided) {
    payload.isAvailable = Boolean(body.isAvailable);
  }

  const resolvedStockQuantity = stockProvided ? payload.stockQuantity : existingItem?.stockQuantity;

  if (resolvedStockQuantity === 0) {
    if (payload.isAvailable === true) {
      throw createHttpError(400, 'Cannot mark an item as available when stock is 0. Restock it first.');
    }

    payload.isAvailable = false;
  } else if (stockProvided && resolvedStockQuantity > 0 && !availabilityProvided) {
    payload.isAvailable = true;
  }

  return payload;
};

router.use(requireAuth);

router.get('/', allowRoles('admin'), async (req, res) => {
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

router.get('/available', allowRoles('admin', 'counter'), async (req, res) => {
  try {
    const items = await MenuItem.find({
      isAvailable: true,
      stockQuantity: { $gt: 0 }
    }).sort({ category: 1, name: 1 });

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', allowRoles('admin'), async (req, res) => {
  try {
    const payload = buildMenuPayload(req.body);

    if (!payload.name) {
      return res.status(400).json({ message: 'Item name is required.' });
    }

    if (!payload.category) {
      return res.status(400).json({ message: 'Valid category is required.' });
    }

    if (payload.price === undefined) {
      return res.status(400).json({ message: 'Valid price is required.' });
    }

    if (payload.stockQuantity === undefined) {
      payload.stockQuantity = 0;
      payload.isAvailable = false;
    }

    const item = new MenuItem(payload);
    await item.save();

    res.status(201).json(item);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }

    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', allowRoles('admin'), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const payload = buildMenuPayload(req.body, item);

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    Object.assign(item, payload);
    await item.save();

    res.json(item);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }

    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', allowRoles('admin'), async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID' });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
