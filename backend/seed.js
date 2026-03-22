require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');

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
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    // Clear existing data
    await User.deleteMany({});
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data (users, menuitems, orders)');

    // Create users — pre-save hook handles bcrypt hashing
    for (const userData of users) {
      await User.create(userData);
    }
    console.log('Users seeded (3 users)');

    // Insert menu items and get saved docs with IDs
    const menuDocs = await MenuItem.insertMany(menuItems);
    console.log('Menu items seeded (15 items)');

    // Build name → doc map
    const m = {};
    menuDocs.forEach(doc => { m[doc.name] = doc; });

    // Helper: build items array from [name, qty] pairs
    const mkItems = (pairs) => pairs.map(([name, qty]) => ({
      itemId: m[name]._id,
      name,
      price: m[name].price,
      quantity: qty
    }));

    // Helper: sum of price×qty
    const subtotalOf = (arr) => arr.reduce((s, i) => s + i.price * i.quantity, 0);

    // Helper: build a timestamp for TODAY at hour:minute
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayAt = (h, min = 0) => {
      const d = new Date(todayStart);
      d.setHours(h, min, 0, 0);
      return d;
    };

    // Helper: build a full order doc
    const mkOrder = (tokenNumber, pairs, h, min, status, discount = 0) => {
      const items = mkItems(pairs);
      const subtotal = subtotalOf(items);
      const gst = Math.round(subtotal * 0.05 * 100) / 100;
      const total = Math.round((subtotal - discount + gst) * 100) / 100;
      const ts = todayAt(h, min);
      return { tokenNumber, items, subtotal, discount, gst, total, status, createdAt: ts, updatedAt: ts };
    };

    // 27 historical orders spread across 8 AM – 5 PM, all "ready"
    const orderDocs = [
      // 8 AM — opening hour
      mkOrder(1,  [['Senor Special Espresso', 1], ['Banana Walnut Muffin', 1]],    8, 12, 'ready'),
      mkOrder(2,  [['Masala Chai Special', 2],    ['Crispy Veg Sandwich', 1]],      8, 47, 'ready'),
      // 9 AM
      mkOrder(3,  [['Cafe Americano', 1]],                                           9,  5, 'ready'),
      mkOrder(4,  [['Cappuccino Royale', 1],      ['Chocolate Brownie', 2]],         9, 22, 'ready'),
      mkOrder(5,  [['Green Tea Senora', 1],        ['Banana Walnut Muffin', 1]],     9, 51, 'ready'),
      // 10 AM
      mkOrder(6,  [['Midnight Black Cold Brew', 1], ['French Fries Classic', 1]],  10,  8, 'ready'),
      mkOrder(7,  [['Senor Special Espresso', 2],   ['Cappuccino Royale', 1]],      10, 44, 'ready'),
      // 11 AM
      mkOrder(8,  [['Masala Chai Special', 1], ['Crispy Veg Sandwich', 1], ['French Fries Classic', 1]], 11, 15, 'ready'),
      mkOrder(9,  [['Classic Cold Coffee', 1],    ['Paneer Club Wrap', 1]],         11, 33, 'ready'),
      mkOrder(10, [['Brew Club Lemonade', 2],     ['Chocolate Brownie', 1]],         11, 55, 'ready'),
      // 12 PM — lunch peak (4 orders)
      mkOrder(11, [['Cafe Americano', 1],          ['Crispy Veg Sandwich', 2]],      12,  5, 'ready'),
      mkOrder(12, [['Paneer Club Wrap', 1], ['French Fries Classic', 1], ['Classic Cold Coffee', 1]], 12, 18, 'ready'),
      mkOrder(13, [['Cappuccino Royale', 1], ['Chocolate Brownie', 1], ['Banana Walnut Muffin', 1]], 12, 34, 'ready'),
      mkOrder(14, [['Mango Tango Shake', 2],       ['Crispy Veg Sandwich', 1]],      12, 47, 'ready', 20),
      // 1 PM
      mkOrder(15, [['Midnight Black Cold Brew', 1]],                                 13, 12, 'ready'),
      mkOrder(16, [['Ginger Lemon Tea', 1],        ['Banana Walnut Muffin', 2]],     13, 28, 'ready'),
      mkOrder(17, [['Brew Club Lemonade', 1],       ['French Fries Classic', 1]],    13, 52, 'ready'),
      // 2 PM
      mkOrder(18, [['Senor Special Espresso', 1], ['Chocolate Brownie', 1]],          14, 10, 'ready'),
      mkOrder(19, [['Cappuccino Royale', 2]],                                          14, 35, 'ready'),
      // 3 PM
      mkOrder(20, [['Mango Tango Shake', 1],       ['Crispy Veg Sandwich', 1]],       15,  5, 'ready'),
      mkOrder(21, [['Green Tea Senora', 2],         ['Banana Walnut Muffin', 1]],      15, 22, 'ready'),
      mkOrder(22, [['Classic Cold Coffee', 1],      ['French Fries Classic', 2]],      15, 48, 'ready'),
      // 4 PM
      mkOrder(23, [['Cafe Americano', 1],           ['Chocolate Brownie', 1]],          16, 15, 'ready'),
      mkOrder(24, [['Masala Chai Special', 2],       ['Paneer Club Wrap', 1]],           16, 40, 'ready'),
      // 5 PM
      mkOrder(25, [['Brew Club Lemonade', 1],        ['Crispy Veg Sandwich', 1]],        17,  8, 'ready'),
      mkOrder(26, [['Midnight Black Cold Brew', 1],  ['Banana Walnut Muffin', 2]],       17, 25, 'ready', 30),
      mkOrder(27, [['Cappuccino Royale', 1],          ['French Fries Classic', 1]],       17, 52, 'ready'),
    ];

    // 3 live/active orders — timestamps relative to NOW so kitchen screen shows them as recent
    const now = new Date();
    const ago = (mins) => new Date(now.getTime() - mins * 60000);

    const addActive = (tokenNumber, pairs, minutesAgo, status) => {
      const items = mkItems(pairs);
      const subtotal = subtotalOf(items);
      const gst = Math.round(subtotal * 0.05 * 100) / 100;
      const total = Math.round((subtotal + gst) * 100) / 100;
      const ts = ago(minutesAgo);
      orderDocs.push({ tokenNumber, items, subtotal, discount: 0, gst, total, status, createdAt: ts, updatedAt: ts });
    };

    addActive(28, [['Mango Tango Shake', 1],       ['Crispy Veg Sandwich', 1]],  22, 'preparing');
    addActive(29, [['Senor Special Espresso', 2],   ['Chocolate Brownie', 1]],    9,  'preparing');
    addActive(30, [['Ginger Lemon Tea', 1],          ['Crispy Veg Sandwich', 1]], 3,  'pending');

    // Use raw collection insert to preserve custom createdAt timestamps
    await Order.collection.insertMany(orderDocs);
    console.log(`Orders seeded (${orderDocs.length} orders)`);

    const totalRevenue = orderDocs.reduce((s, o) => s + o.total, 0);
    console.log(`\n✅ Database seeded successfully!`);
    console.log(`   ${orderDocs.length} orders · ₹${totalRevenue.toFixed(2)} total revenue`);
    console.log(`   3 active orders (pending/preparing) for kitchen screen`);
    console.log('\nLogin credentials:');
    console.log('  Admin:   admin@senorbrew.com   / admin123');
    console.log('  Counter: counter@senorbrew.com / counter123');
    console.log('  Kitchen: kitchen@senorbrew.com / kitchen123');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
}

seed();
