const GST_RATE = 0.05;

const roundCurrency = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const calculateSubtotal = (items) =>
  roundCurrency(items.reduce((sum, item) => sum + roundCurrency(item.price) * item.quantity, 0));

const calculateTotalsFromDiscountAmount = (subtotal, discountAmount = 0) => {
  const safeSubtotal = roundCurrency(subtotal);
  const safeDiscount = roundCurrency(Math.min(Math.max(Number(discountAmount) || 0, 0), safeSubtotal));
  const taxableAmount = roundCurrency(safeSubtotal - safeDiscount);
  const gst = roundCurrency(taxableAmount * GST_RATE);
  const total = roundCurrency(taxableAmount + gst);

  return {
    subtotal: safeSubtotal,
    discount: safeDiscount,
    gst,
    total
  };
};

const calculateTotalsFromDiscountPercentage = (items, discountPercentage = 0) => {
  const subtotal = calculateSubtotal(items);
  const safeDiscountPercentage = Math.min(Math.max(Number(discountPercentage) || 0, 0), 100);
  const discountAmount = roundCurrency((subtotal * safeDiscountPercentage) / 100);

  return {
    ...calculateTotalsFromDiscountAmount(subtotal, discountAmount),
    discountPercentage: roundCurrency(safeDiscountPercentage)
  };
};

module.exports = {
  GST_RATE,
  roundCurrency,
  calculateSubtotal,
  calculateTotalsFromDiscountAmount,
  calculateTotalsFromDiscountPercentage
};
