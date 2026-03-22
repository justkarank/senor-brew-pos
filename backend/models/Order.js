const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  tokenNumber: { type: Number, required: true },
  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      quantity: { type: Number, required: true, min: 1 }
    }
  ],
  subtotal: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  gst: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready'],
    default: 'pending'
  }
}, { timestamps: true });

// Indexes for performance — orders queried heavily by date
orderSchema.index({ createdAt: -1 });
orderSchema.index({ createdAt: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
