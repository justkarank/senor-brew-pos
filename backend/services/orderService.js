const mongoose = require('mongoose');
const Counter = require('../models/Counter');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { getBusinessDateKey } = require('../utils/businessDate');
const { calculateTotalsFromDiscountPercentage, roundCurrency } = require('../utils/orderPricing');

const MAX_TRANSACTION_ATTEMPTS = 3;

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const normalizeDiscountPercentage = (value) => {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 100) {
    throw createHttpError(400, 'Discount percentage must be between 0 and 100.');
  }

  return roundCurrency(parsedValue);
};

const normalizeOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, 'Order must have at least one item.');
  }

  const mergedItems = new Map();

  for (const item of items) {
    if (!item?.itemId || !mongoose.Types.ObjectId.isValid(item.itemId)) {
      throw createHttpError(400, 'Each ordered item must contain a valid menu item ID.');
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw createHttpError(400, 'Each ordered item must have a quantity of at least 1.');
    }

    const itemId = item.itemId.toString();
    mergedItems.set(itemId, (mergedItems.get(itemId) || 0) + quantity);
  }

  return Array.from(mergedItems.entries()).map(([itemId, quantity]) => ({ itemId, quantity }));
};

const getMenuItemsForOrder = async (normalizedItems, session) => {
  const itemIds = normalizedItems.map(item => item.itemId);
  const menuItems = await MenuItem.find({ _id: { $in: itemIds } }).session(session);

  if (menuItems.length !== itemIds.length) {
    throw createHttpError(400, 'One or more selected items no longer exist in the menu.');
  }

  return new Map(menuItems.map(item => [item._id.toString(), item]));
};

const buildOrderItems = (normalizedItems, menuItemsById) =>
  normalizedItems.map(({ itemId, quantity }) => {
    const menuItem = menuItemsById.get(itemId);

    if (!menuItem) {
      throw createHttpError(400, 'One or more selected items no longer exist in the menu.');
    }

    if (!menuItem.isAvailable || menuItem.stockQuantity <= 0) {
      throw createHttpError(400, `${menuItem.name} is currently unavailable.`);
    }

    if (menuItem.stockQuantity < quantity) {
      throw createHttpError(400, `${menuItem.name} has only ${menuItem.stockQuantity} left in stock.`);
    }

    return {
      itemId: menuItem._id,
      name: menuItem.name,
      price: roundCurrency(menuItem.price),
      quantity
    };
  });

const allocateDailyToken = async (orderDateKey, session) => {
  const counter = await Counter.findOneAndUpdate(
    { dateKey: orderDateKey },
    {
      $inc: { sequence: 1 },
      $setOnInsert: { dateKey: orderDateKey }
    },
    {
      new: true,
      upsert: true,
      session,
      setDefaultsOnInsert: true
    }
  );

  return counter.sequence;
};

const applyStockChanges = async (orderItems, menuItemsById, session) => {
  for (const orderItem of orderItems) {
    const menuItem = menuItemsById.get(orderItem.itemId.toString());

    menuItem.stockQuantity -= orderItem.quantity;

    if (menuItem.stockQuantity < 0) {
      throw createHttpError(409, `Stock for ${menuItem.name} changed during checkout. Please try again.`);
    }

    if (menuItem.stockQuantity === 0) {
      menuItem.isAvailable = false;
    }

    await menuItem.save({ session });
  }
};

const createOrderDocument = async ({ items, discountPercentage }, session) => {
  const normalizedItems = normalizeOrderItems(items);
  const orderDateKey = getBusinessDateKey();
  const menuItemsById = await getMenuItemsForOrder(normalizedItems, session);
  const orderItems = buildOrderItems(normalizedItems, menuItemsById);
  const totals = calculateTotalsFromDiscountPercentage(
    orderItems,
    normalizeDiscountPercentage(discountPercentage)
  );
  const tokenNumber = await allocateDailyToken(orderDateKey, session);

  await applyStockChanges(orderItems, menuItemsById, session);

  const order = new Order({
    orderDateKey,
    tokenNumber,
    items: orderItems,
    subtotal: totals.subtotal,
    discount: totals.discount,
    gst: totals.gst,
    total: totals.total
  });

  await order.save({ session });

  return order;
};

const isRetryableTransactionError = (error) =>
  error?.errorLabels?.includes('TransientTransactionError') ||
  error?.errorLabels?.includes('UnknownTransactionCommitResult') ||
  error?.code === 112 ||
  error?.codeName === 'WriteConflict';

const normalizeTransactionError = (error) => {
  if (error?.status) {
    return error;
  }

  if (error?.code === 11000) {
    return createHttpError(409, 'A duplicate token was detected. Please try placing the order again.');
  }

  if (isRetryableTransactionError(error)) {
    return createHttpError(409, 'Stock changed while placing the order. Please try again.');
  }

  return error;
};

const createOrder = async ({ items, discountPercentage }) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    const session = await mongoose.startSession();

    try {
      let createdOrder;

      await session.withTransaction(async () => {
        createdOrder = await createOrderDocument({ items, discountPercentage }, session);
      });

      return createdOrder;
    } catch (error) {
      lastError = normalizeTransactionError(error);

      if (!isRetryableTransactionError(error) || attempt === MAX_TRANSACTION_ATTEMPTS) {
        throw lastError;
      }
    } finally {
      await session.endSession();
    }
  }

  throw lastError || createHttpError(500, 'Failed to create order.');
};

module.exports = {
  createOrder,
  createHttpError
};
