const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { requireAuth, allowRoles } = require('../middleware/auth');
const { getBusinessDayOrderFilter, getBusinessHour } = require('../utils/businessDate');
const { roundCurrency } = require('../utils/orderPricing');

router.use(requireAuth);

router.get('/stats', allowRoles('admin'), async (req, res) => {
  try {
    const orders = await Order.find(getBusinessDayOrderFilter()).sort({ createdAt: -1 });

    const totalRevenue = roundCurrency(orders.reduce((sum, order) => sum + order.total, 0));
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? roundCurrency(totalRevenue / totalOrders) : 0;

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

    const hourCounts = Array(24).fill(0);
    orders.forEach(order => {
      const hour = getBusinessHour(order.createdAt);
      hourCounts[hour] += 1;
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
      orders: orders.map(order => ({
        _id: order._id,
        tokenNumber: order.tokenNumber,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        gst: order.gst,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt
      }))
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
