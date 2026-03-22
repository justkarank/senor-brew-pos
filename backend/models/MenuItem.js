const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Coffee', 'Tea', 'Snacks', 'Cold Drinks', 'Other'],
    required: true
  },
  price: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, default: 0, min: 0 },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

menuItemSchema.pre('save', function updateAvailabilityFromStock(next) {
  if (this.stockQuantity <= 0) {
    this.isAvailable = false;
  }

  next();
});

// Indexes for query performance
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1 });
menuItemSchema.index({ category: 1, name: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
