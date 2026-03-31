const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const roundCurrency = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const calculateSubtotal = (items) =>
  roundCurrency(items.reduce((sum, item) => sum + roundCurrency(item.price) * item.quantity, 0));

export const calculateTotalsFromDiscountPercentage = (items, discountPercentage = 0) => {
  const subtotal = calculateSubtotal(items);
  const safeDiscountPercentage = Math.min(Math.max(Number(discountPercentage) || 0, 0), 100);
  const discount = roundCurrency((subtotal * safeDiscountPercentage) / 100);
  const taxableAmount = roundCurrency(subtotal - discount);
  const gst = roundCurrency(taxableAmount * 0.05);
  const total = roundCurrency(taxableAmount + gst);

  return {
    subtotal,
    discount,
    gst,
    total
  };
};

export const formatCurrency = (value) => {
  const numericValue = Number(value);
  return currencyFormatter.format(Number.isFinite(numericValue) ? numericValue : 0);
};
