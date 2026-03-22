const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// GET /api/dashboard/stats — today's sales stats
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({ createdAt: { $gte: today } }).sort({ createdAt: -1 });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Tally item quantities for most sold item
    const itemCounts = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      });
    });

    const mostSoldItem =
      Object.keys(itemCounts).length > 0
        ? Object.keys(itemCounts).reduce((a, b) => (itemCounts[a] > itemCounts[b] ? a : b))
        : 'N/A';

    // Build orders-per-hour array (index = hour 0-23)
    const hourCounts = Array(24).fill(0);
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour]++;
    });

    const hourlyData = hourCounts.map((count, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      orders: count
    }));

    res.json({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      mostSoldItem,
      hourlyData,
      orders: orders.map(o => ({
        _id: o._id,
        tokenNumber: o.tokenNumber,
        items: o.items,
        subtotal: o.subtotal,
        discount: o.discount,
        gst: o.gst,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt
      }))
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
