const DEMO_USERS = [
  {
    demoKey: 'demo-admin',
    name: 'Admin',
    email: 'admin@senorbrew.com',
    role: 'admin'
  },
  {
    demoKey: 'demo-counter',
    name: 'Counter Staff',
    email: 'counter@senorbrew.com',
    role: 'counter'
  },
  {
    demoKey: 'demo-kitchen',
    name: 'Kitchen Staff',
    email: 'kitchen@senorbrew.com',
    role: 'kitchen'
  }
];

const DEMO_MENU_ITEMS = [
  { demoKey: 'senor-special-espresso', name: 'Senor Special Espresso', category: 'Coffee', price: 120, stockQuantity: 50, isAvailable: true },
  { demoKey: 'cafe-americano', name: 'Cafe Americano', category: 'Coffee', price: 140, stockQuantity: 50, isAvailable: true },
  { demoKey: 'cappuccino-royale', name: 'Cappuccino Royale', category: 'Coffee', price: 180, stockQuantity: 40, isAvailable: true },
  { demoKey: 'midnight-black-cold-brew', name: 'Midnight Black Cold Brew', category: 'Coffee', price: 220, stockQuantity: 30, isAvailable: true },
  { demoKey: 'masala-chai-special', name: 'Masala Chai Special', category: 'Tea', price: 80, stockQuantity: 8, isAvailable: true },
  { demoKey: 'green-tea-senora', name: 'Green Tea Senora', category: 'Tea', price: 100, stockQuantity: 3, isAvailable: true },
  { demoKey: 'ginger-lemon-tea', name: 'Ginger Lemon Tea', category: 'Tea', price: 90, stockQuantity: 25, isAvailable: true },
  { demoKey: 'brew-club-lemonade', name: 'Brew Club Lemonade', category: 'Cold Drinks', price: 130, stockQuantity: 20, isAvailable: true },
  { demoKey: 'mango-tango-shake', name: 'Mango Tango Shake', category: 'Cold Drinks', price: 160, stockQuantity: 15, isAvailable: true },
  { demoKey: 'classic-cold-coffee', name: 'Classic Cold Coffee', category: 'Cold Drinks', price: 150, stockQuantity: 4, isAvailable: true },
  { demoKey: 'crispy-veg-sandwich', name: 'Crispy Veg Sandwich', category: 'Snacks', price: 120, stockQuantity: 20, isAvailable: true },
  { demoKey: 'paneer-club-wrap', name: 'Paneer Club Wrap', category: 'Snacks', price: 160, stockQuantity: 2, isAvailable: true },
  { demoKey: 'french-fries-classic', name: 'French Fries Classic', category: 'Snacks', price: 100, stockQuantity: 30, isAvailable: true },
  { demoKey: 'chocolate-brownie', name: 'Chocolate Brownie', category: 'Other', price: 110, stockQuantity: 15, isAvailable: true },
  { demoKey: 'banana-walnut-muffin', name: 'Banana Walnut Muffin', category: 'Other', price: 90, stockQuantity: 12, isAvailable: true }
];

const DEMO_READY_ORDER_TEMPLATES = [
  { demoKey: 'ready-01', pairs: [['Senor Special Espresso', 1], ['Banana Walnut Muffin', 1]], hour: 8, minute: 12, status: 'ready' },
  { demoKey: 'ready-02', pairs: [['Masala Chai Special', 2], ['Crispy Veg Sandwich', 1]], hour: 8, minute: 47, status: 'ready' },
  { demoKey: 'ready-03', pairs: [['Cafe Americano', 1]], hour: 9, minute: 5, status: 'ready' },
  { demoKey: 'ready-04', pairs: [['Cappuccino Royale', 1], ['Chocolate Brownie', 2]], hour: 9, minute: 22, status: 'ready' },
  { demoKey: 'ready-05', pairs: [['Green Tea Senora', 1], ['Banana Walnut Muffin', 1]], hour: 9, minute: 51, status: 'ready' },
  { demoKey: 'ready-06', pairs: [['Midnight Black Cold Brew', 1], ['French Fries Classic', 1]], hour: 10, minute: 8, status: 'ready' },
  { demoKey: 'ready-07', pairs: [['Senor Special Espresso', 2], ['Cappuccino Royale', 1]], hour: 10, minute: 44, status: 'ready' },
  { demoKey: 'ready-08', pairs: [['Masala Chai Special', 1], ['Crispy Veg Sandwich', 1], ['French Fries Classic', 1]], hour: 11, minute: 15, status: 'ready' },
  { demoKey: 'ready-09', pairs: [['Classic Cold Coffee', 1], ['Paneer Club Wrap', 1]], hour: 11, minute: 33, status: 'ready' },
  { demoKey: 'ready-10', pairs: [['Brew Club Lemonade', 2], ['Chocolate Brownie', 1]], hour: 11, minute: 55, status: 'ready' },
  { demoKey: 'ready-11', pairs: [['Cafe Americano', 1], ['Crispy Veg Sandwich', 2]], hour: 12, minute: 5, status: 'ready' },
  { demoKey: 'ready-12', pairs: [['Paneer Club Wrap', 1], ['French Fries Classic', 1], ['Classic Cold Coffee', 1]], hour: 12, minute: 18, status: 'ready' },
  { demoKey: 'ready-13', pairs: [['Cappuccino Royale', 1], ['Chocolate Brownie', 1], ['Banana Walnut Muffin', 1]], hour: 12, minute: 34, status: 'ready' },
  { demoKey: 'ready-14', pairs: [['Mango Tango Shake', 2], ['Crispy Veg Sandwich', 1]], hour: 12, minute: 47, status: 'ready', discount: 20 },
  { demoKey: 'ready-15', pairs: [['Midnight Black Cold Brew', 1]], hour: 13, minute: 12, status: 'ready' },
  { demoKey: 'ready-16', pairs: [['Ginger Lemon Tea', 1], ['Banana Walnut Muffin', 2]], hour: 13, minute: 28, status: 'ready' },
  { demoKey: 'ready-17', pairs: [['Brew Club Lemonade', 1], ['French Fries Classic', 1]], hour: 13, minute: 52, status: 'ready' },
  { demoKey: 'ready-18', pairs: [['Senor Special Espresso', 1], ['Chocolate Brownie', 1]], hour: 14, minute: 10, status: 'ready' },
  { demoKey: 'ready-19', pairs: [['Cappuccino Royale', 2]], hour: 14, minute: 35, status: 'ready' },
  { demoKey: 'ready-20', pairs: [['Mango Tango Shake', 1], ['Crispy Veg Sandwich', 1]], hour: 15, minute: 5, status: 'ready' },
  { demoKey: 'ready-21', pairs: [['Green Tea Senora', 2], ['Banana Walnut Muffin', 1]], hour: 15, minute: 22, status: 'ready' },
  { demoKey: 'ready-22', pairs: [['Classic Cold Coffee', 1], ['French Fries Classic', 2]], hour: 15, minute: 48, status: 'ready' },
  { demoKey: 'ready-23', pairs: [['Cafe Americano', 1], ['Chocolate Brownie', 1]], hour: 16, minute: 15, status: 'ready' },
  { demoKey: 'ready-24', pairs: [['Masala Chai Special', 2], ['Paneer Club Wrap', 1]], hour: 16, minute: 40, status: 'ready' },
  { demoKey: 'ready-25', pairs: [['Brew Club Lemonade', 1], ['Crispy Veg Sandwich', 1]], hour: 17, minute: 8, status: 'ready' },
  { demoKey: 'ready-26', pairs: [['Midnight Black Cold Brew', 1], ['Banana Walnut Muffin', 2]], hour: 17, minute: 25, status: 'ready', discount: 30 },
  { demoKey: 'ready-27', pairs: [['Cappuccino Royale', 1], ['French Fries Classic', 1]], hour: 17, minute: 52, status: 'ready' }
];

const DEMO_ACTIVE_ORDER_TEMPLATES = [
  { demoKey: 'active-28', pairs: [['Mango Tango Shake', 1], ['Crispy Veg Sandwich', 1]], minutesAgo: 22, status: 'preparing' },
  { demoKey: 'active-29', pairs: [['Senor Special Espresso', 2], ['Chocolate Brownie', 1]], minutesAgo: 9, status: 'preparing' },
  { demoKey: 'active-30', pairs: [['Ginger Lemon Tea', 1], ['Crispy Veg Sandwich', 1]], minutesAgo: 3, status: 'pending' }
];

module.exports = {
  DEMO_USERS,
  DEMO_MENU_ITEMS,
  DEMO_READY_ORDER_TEMPLATES,
  DEMO_ACTIVE_ORDER_TEMPLATES
};
