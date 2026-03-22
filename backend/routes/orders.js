const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { requireAuth, allowRoles } = require('../middleware/auth');
const { getBusinessDayOrderFilter } = require('../utils/businessDate');
const { createOrder } = require('../services/orderService');

const VALID_STATUSES = ['pending', 'preparing', 'ready'];

router.use(requireAuth);

router.get('/today', allowRoles('admin', 'kitchen'), async (req, res) => {
  try {
    const orders = await Order.find(getBusinessDayOrderFilter()).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', allowRoles('admin', 'counter'), async (req, res) => {
  try {
    const order = await createOrder({
      items: req.body.items,
      discountPercentage: req.body.discountPercentage
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('newOrder', order);
    }

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err.message);

    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }

    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/status', allowRoles('admin', 'kitchen'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('orderStatusUpdate', order);
    }

    res.json(order);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
