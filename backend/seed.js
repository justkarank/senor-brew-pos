require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');
const Counter = require('./models/Counter');
const { BUSINESS_UTC_OFFSET, getBusinessDateKey } = require('./utils/businessDate');
const {
  calculateSubtotal,
  calculateTotalsFromDiscountAmount
} = require('./utils/orderPricing');

const users = [
  { name: 'Admin', email: 'admin@senorbrew.com', password: 'admin123', role: 'admin' },
  { name: 'Counter Staff', email: 'counter@senorbrew.com', password: 'counter123', role: 'counter' },
  { name: 'Kitchen Staff', email: 'kitchen@senorbrew.com', password: 'kitchen123', role: 'kitchen' }
];

const menuItems = [
  { name: 'Senor Special Espresso', category: 'Coffee', price: 120, stockQuantity: 50, isAvailable: true },
  { name: 'Cafe Americano', category: 'Coffee', price: 140, stockQuantity: 50, isAvailable: true },
  { name: 'Cappuccino Royale', category: 'Coffee', price: 180, stockQuantity: 40, isAvailable: true },
  { name: 'Midnight Black Cold Brew', category: 'Coffee', price: 220, stockQuantity: 30, isAvailable: true },
  { name: 'Masala Chai Special', category: 'Tea', price: 80, stockQuantity: 8, isAvailable: true },
  { name: 'Green Tea Senora', category: 'Tea', price: 100, stockQuantity: 3, isAvailable: true },
  { name: 'Ginger Lemon Tea', category: 'Tea', price: 90, stockQuantity: 25, isAvailable: true },
  { name: 'Brew Club Lemonade', category: 'Cold Drinks', price: 130, stockQuantity: 20, isAvailable: true },
  { name: 'Mango Tango Shake', category: 'Cold Drinks', price: 160, stockQuantity: 15, isAvailable: true },
  { name: 'Classic Cold Coffee', category: 'Cold Drinks', price: 150, stockQuantity: 4, isAvailable: true },
  { name: 'Crispy Veg Sandwich', category: 'Snacks', price: 120, stockQuantity: 20, isAvailable: true },
  { name: 'Paneer Club Wrap', category: 'Snacks', price: 160, stockQuantity: 2, isAvailable: true },
  { name: 'French Fries Classic', category: 'Snacks', price: 100, stockQuantity: 30, isAvailable: true },
  { name: 'Chocolate Brownie', category: 'Other', price: 110, stockQuantity: 15, isAvailable: true },
  { name: 'Banana Walnut Muffin', category: 'Other', price: 90, stockQuantity: 12, isAvailable: true }
];

async function seed() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('Missing MONGO_URI. Create backend/.env from backend/.env.example before seeding.');
    }

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected to MongoDB Atlas');

    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    await Counter.deleteMany({});
    console.log('Cleared existing data (users, menu items, orders, counters)');

    for (const userData of users) {
      await User.create(userData);
    }
    console.log('Users seeded (3 users)');

    const menuDocs = await MenuItem.insertMany(menuItems);
    console.log('Menu items seeded (15 items)');

    const menuMap = {};
    menuDocs.forEach(doc => {
      menuMap[doc.name] = doc;
    });

    const mkItems = (pairs) => pairs.map(([name, quantity]) => ({
      itemId: menuMap[name]._id,
      name,
      price: menuMap[name].price,
      quantity
    }));

    const subtotalOf = (items) => calculateSubtotal(items);
    const orderDateKey = getBusinessDateKey();

    const todayAt = (hour, minute = 0) =>
      new Date(
        `${orderDateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000${BUSINESS_UTC_OFFSET}`
      );

    const mkOrder = (tokenNumber, pairs, hour, minute, status, discount = 0) => {
      const items = mkItems(pairs);
      const totals = calculateTotalsFromDiscountAmount(subtotalOf(items), discount);
      const timestamp = todayAt(hour, minute);

      return {
        orderDateKey,
        tokenNumber,
        items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        gst: totals.gst,
        total: totals.total,
        status,
        createdAt: timestamp,
        updatedAt: timestamp
      };
    };

    const orderDocs = [
      mkOrder(1, [['Senor Special Espresso', 1], ['Banana Walnut Muffin', 1]], 8, 12, 'ready'),
      mkOrder(2, [['Masala Chai Special', 2], ['Crispy Veg Sandwich', 1]], 8, 47, 'ready'),
      mkOrder(3, [['Cafe Americano', 1]], 9, 5, 'ready'),
      mkOrder(4, [['Cappuccino Royale', 1], ['Chocolate Brownie', 2]], 9, 22, 'ready'),
      mkOrder(5, [['Green Tea Senora', 1], ['Banana Walnut Muffin', 1]], 9, 51, 'ready'),
      mkOrder(6, [['Midnight Black Cold Brew', 1], ['French Fries Classic', 1]], 10, 8, 'ready'),
      mkOrder(7, [['Senor Special Espresso', 2], ['Cappuccino Royale', 1]], 10, 44, 'ready'),
      mkOrder(8, [['Masala Chai Special', 1], ['Crispy Veg Sandwich', 1], ['French Fries Classic', 1]], 11, 15, 'ready'),
      mkOrder(9, [['Classic Cold Coffee', 1], ['Paneer Club Wrap', 1]], 11, 33, 'ready'),
      mkOrder(10, [['Brew Club Lemonade', 2], ['Chocolate Brownie', 1]], 11, 55, 'ready'),
      mkOrder(11, [['Cafe Americano', 1], ['Crispy Veg Sandwich', 2]], 12, 5, 'ready'),
      mkOrder(12, [['Paneer Club Wrap', 1], ['French Fries Classic', 1], ['Classic Cold Coffee', 1]], 12, 18, 'ready'),
      mkOrder(13, [['Cappuccino Royale', 1], ['Chocolate Brownie', 1], ['Banana Walnut Muffin', 1]], 12, 34, 'ready'),
      mkOrder(14, [['Mango Tango Shake', 2], ['Crispy Veg Sandwich', 1]], 12, 47, 'ready', 20),
      mkOrder(15, [['Midnight Black Cold Brew', 1]], 13, 12, 'ready'),
      mkOrder(16, [['Ginger Lemon Tea', 1], ['Banana Walnut Muffin', 2]], 13, 28, 'ready'),
      mkOrder(17, [['Brew Club Lemonade', 1], ['French Fries Classic', 1]], 13, 52, 'ready'),
      mkOrder(18, [['Senor Special Espresso', 1], ['Chocolate Brownie', 1]], 14, 10, 'ready'),
      mkOrder(19, [['Cappuccino Royale', 2]], 14, 35, 'ready'),
      mkOrder(20, [['Mango Tango Shake', 1], ['Crispy Veg Sandwich', 1]], 15, 5, 'ready'),
      mkOrder(21, [['Green Tea Senora', 2], ['Banana Walnut Muffin', 1]], 15, 22, 'ready'),
      mkOrder(22, [['Classic Cold Coffee', 1], ['French Fries Classic', 2]], 15, 48, 'ready'),
      mkOrder(23, [['Cafe Americano', 1], ['Chocolate Brownie', 1]], 16, 15, 'ready'),
      mkOrder(24, [['Masala Chai Special', 2], ['Paneer Club Wrap', 1]], 16, 40, 'ready'),
      mkOrder(25, [['Brew Club Lemonade', 1], ['Crispy Veg Sandwich', 1]], 17, 8, 'ready'),
      mkOrder(26, [['Midnight Black Cold Brew', 1], ['Banana Walnut Muffin', 2]], 17, 25, 'ready', 30),
      mkOrder(27, [['Cappuccino Royale', 1], ['French Fries Classic', 1]], 17, 52, 'ready')
    ];

    const now = new Date();
    const ago = (minutes) => new Date(now.getTime() - minutes * 60000);

    const addActive = (tokenNumber, pairs, minutesAgo, status) => {
      const items = mkItems(pairs);
      const totals = calculateTotalsFromDiscountAmount(subtotalOf(items), 0);
      const timestamp = ago(minutesAgo);

      orderDocs.push({
        orderDateKey,
        tokenNumber,
        items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        gst: totals.gst,
        total: totals.total,
        status,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    };

    addActive(28, [['Mango Tango Shake', 1], ['Crispy Veg Sandwich', 1]], 22, 'preparing');
    addActive(29, [['Senor Special Espresso', 2], ['Chocolate Brownie', 1]], 9, 'preparing');
    addActive(30, [['Ginger Lemon Tea', 1], ['Crispy Veg Sandwich', 1]], 3, 'pending');

    await Order.collection.insertMany(orderDocs);
    await Counter.create({ dateKey: orderDateKey, sequence: orderDocs.length });
    console.log(`Orders seeded (${orderDocs.length} orders)`);

    const totalRevenue = orderDocs.reduce((sum, order) => sum + order.total, 0);
    console.log('\nDatabase seeded successfully!');
    console.log(`   ${orderDocs.length} orders | INR ${totalRevenue.toFixed(2)} total revenue`);
    console.log('   3 active orders (pending/preparing) for kitchen screen');
    console.log('\nLogin credentials:');
    console.log('  Admin:   admin@senorbrew.com   / admin123');
    console.log('  Counter: counter@senorbrew.com / counter123');
    console.log('  Kitchen: kitchen@senorbrew.com / kitchen123');

    process.exit(0);
  } catch (err) {
    if (/whitelist|network access/i.test(err.message)) {
      console.error('MongoDB Atlas rejected the connection. Add your current IP or 0.0.0.0/0 in Atlas Network Access.');
    }
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
}

seed();
