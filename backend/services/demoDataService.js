const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Counter = require('../models/Counter');
const {
  DEMO_USERS,
  DEMO_MENU_ITEMS,
  DEMO_READY_ORDER_TEMPLATES,
  DEMO_ACTIVE_ORDER_TEMPLATES
} = require('../data/demoCatalog');
const { BUSINESS_UTC_OFFSET, getBusinessDateKey } = require('../utils/businessDate');
const {
  calculateSubtotal,
  calculateTotalsFromDiscountAmount
} = require('../utils/orderPricing');

const noop = () => {};
const DEMO_MENU_NAME_TO_KEY = new Map(DEMO_MENU_ITEMS.map(item => [item.name, item.demoKey]));

const buildSummary = () => ({
  usersCreated: 0,
  usersLinked: 0,
  menuCreated: 0,
  menuLinked: 0,
  ordersCreated: 0,
  resetApplied: false,
  orderDateKey: null
});

const getBusinessDayStart = (orderDateKey) =>
  new Date(`${orderDateKey}T00:00:00.000${BUSINESS_UTC_OFFSET}`);

const makeScheduledTimestamp = (orderDateKey, hour, minute) =>
  new Date(
    `${orderDateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000${BUSINESS_UTC_OFFSET}`
  );

const makeRelativeTimestamp = (orderDateKey, now, minutesAgo) => {
  const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000);
  const businessDayStart = getBusinessDayStart(orderDateKey);

  if (timestamp >= businessDayStart) {
    return timestamp;
  }

  return new Date(businessDayStart.getTime() + 60 * 1000);
};

async function linkExistingUsers() {
  let linked = 0;

  for (const user of DEMO_USERS) {
    const result = await User.updateOne(
      { email: user.email, demoKey: { $exists: false } },
      { $set: { demoKey: user.demoKey } }
    );

    linked += result.modifiedCount;
  }

  return linked;
}

async function ensureUsers(summary) {
  summary.usersLinked += await linkExistingUsers();

  for (const user of DEMO_USERS) {
    const existingUser = await User.findOne({ demoKey: user.demoKey }).select('_id');

    if (existingUser) {
      continue;
    }

    await User.create(user);
    summary.usersCreated += 1;
  }
}

async function linkExistingMenuItems() {
  let linked = 0;

  for (const item of DEMO_MENU_ITEMS) {
    const result = await MenuItem.updateOne(
      { name: item.name, demoKey: { $exists: false } },
      { $set: { demoKey: item.demoKey } }
    );

    linked += result.modifiedCount;
  }

  return linked;
}

async function ensureMenuItems(summary) {
  summary.menuLinked += await linkExistingMenuItems();

  for (const item of DEMO_MENU_ITEMS) {
    const result = await MenuItem.updateOne(
      { demoKey: item.demoKey },
      { $setOnInsert: item },
      { upsert: true }
    );

    summary.menuCreated += result.upsertedCount || 0;
  }
}

async function getDemoMenuMap() {
  const demoKeys = DEMO_MENU_ITEMS.map(item => item.demoKey);
  const menuDocs = await MenuItem.find({ demoKey: { $in: demoKeys } });
  const menuMap = new Map();

  menuDocs.forEach((doc) => {
    if (doc.demoKey) {
      menuMap.set(doc.demoKey, doc);
    }

    menuMap.set(doc.name, doc);
  });

  return menuMap;
}

const buildOrderItems = (pairs, menuMap) =>
  pairs.map(([name, quantity]) => {
    const menuItem = menuMap.get(name) || menuMap.get(DEMO_MENU_NAME_TO_KEY.get(name));

    if (!menuItem) {
      throw new Error(`Missing demo menu item "${name}" while building demo orders.`);
    }

    return {
      itemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity
    };
  });

const buildDemoOrderDoc = ({
  template,
  tokenNumber,
  orderDateKey,
  items,
  createdAt
}) => {
  const subtotal = calculateSubtotal(items);
  const totals = calculateTotalsFromDiscountAmount(subtotal, template.discount || 0);

  return {
    orderDateKey,
    tokenNumber,
    items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    gst: totals.gst,
    total: totals.total,
    status: template.status,
    isDemo: true,
    demoKey: template.demoKey,
    createdAt,
    updatedAt: createdAt
  };
};

async function ensureDailyDemoOrders(summary, now) {
  const orderDateKey = getBusinessDateKey(now);
  const [menuMap, todayOrders, existingCounter] = await Promise.all([
    getDemoMenuMap(),
    Order.find({ orderDateKey }).select('tokenNumber demoKey'),
    Counter.findOne({ dateKey: orderDateKey }).select('sequence')
  ]);

  summary.orderDateKey = orderDateKey;

  const existingDemoKeys = new Set(
    todayOrders
      .filter(order => Boolean(order.demoKey))
      .map(order => order.demoKey)
  );

  let nextToken = Math.max(
    existingCounter?.sequence || 0,
    ...todayOrders.map(order => order.tokenNumber),
    0
  );

  const orderDocs = [];

  for (const template of DEMO_READY_ORDER_TEMPLATES) {
    if (existingDemoKeys.has(template.demoKey)) {
      continue;
    }

    nextToken += 1;
    orderDocs.push(
      buildDemoOrderDoc({
        template,
        tokenNumber: nextToken,
        orderDateKey,
        items: buildOrderItems(template.pairs, menuMap),
        createdAt: makeScheduledTimestamp(orderDateKey, template.hour, template.minute)
      })
    );
  }

  for (const template of DEMO_ACTIVE_ORDER_TEMPLATES) {
    if (existingDemoKeys.has(template.demoKey)) {
      continue;
    }

    nextToken += 1;
    orderDocs.push(
      buildDemoOrderDoc({
        template,
        tokenNumber: nextToken,
        orderDateKey,
        items: buildOrderItems(template.pairs, menuMap),
        createdAt: makeRelativeTimestamp(orderDateKey, now, template.minutesAgo)
      })
    );
  }

  if (orderDocs.length > 0) {
    await Order.collection.insertMany(orderDocs);
  }

  await Counter.findOneAndUpdate(
    { dateKey: orderDateKey },
    {
      $setOnInsert: { dateKey: orderDateKey },
      $max: { sequence: nextToken }
    },
    {
      new: true,
      upsert: true
    }
  );

  summary.ordersCreated += orderDocs.length;
}

async function resetAllData(summary) {
  await Promise.all([
    User.deleteMany({}),
    MenuItem.deleteMany({}),
    Order.deleteMany({}),
    Counter.deleteMany({})
  ]);

  summary.resetApplied = true;
}

async function ensureDemoData(options = {}) {
  const {
    reset = false,
    now = new Date(),
    log = noop
  } = options;
  const summary = buildSummary();

  if (reset) {
    await resetAllData(summary);
    log('Cleared existing data (users, menu items, orders, counters)');
  }

  await ensureUsers(summary);
  await ensureMenuItems(summary);
  await ensureDailyDemoOrders(summary, now);

  log(
    `Demo data ready for ${summary.orderDateKey}: ` +
      `${summary.usersCreated} users added, ` +
      `${summary.menuCreated} menu items added, ` +
      `${summary.ordersCreated} demo orders added`
  );

  return summary;
}

module.exports = {
  ensureDemoData
};
