const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');

const VALID_STATUSES = ['pending', 'preparing', 'ready'];

// GET /api/orders/today — all orders from today
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow }
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/orders — create new order
router.post('/', auth, async (req, res) => {
  try {
    const { items, subtotal, discount, gst, total } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }
    if (subtotal === undefined || gst === undefined || total === undefined) {
      return res.status(400).json({ message: 'subtotal, gst, and total are required' });
    }
    if (Number(subtotal) < 0 || Number(total) < 0) {
      return res.status(400).json({ message: 'Invalid order amounts' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orderCount = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const order = new Order({
      items,
      subtotal: Number(subtotal),
      discount: Number(discount) || 0,
      gst: Number(gst),
      total: Number(total),
      tokenNumber: orderCount + 1
    });

    await order.save();

    // Decrement stock for each ordered item
    for (const item of order.items) {
      if (item.itemId) {
        await MenuItem.findByIdAndUpdate(item.itemId, {
          $inc: { stockQuantity: -item.quantity }
        });
      }
    }

    // Emit new order to kitchen via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('newOrder', order);
    }

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/orders/:id/status — update order status
router.put('/:id/status', auth, async (req, res) => {
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
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Emit status update to all connected clients
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
