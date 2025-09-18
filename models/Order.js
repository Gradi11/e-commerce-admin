const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: {
    type: Array,
    required: true,
  },
  delivery_address: {
    type: Array, 
    required: true,
  },
  delivery_option: {
    type: String,
    required: true,
  },
  payment_status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'card_payment_pending', 'payment_pending'],
    default: 'pending'
  },
  order_status: {
    type: String,
    required: true,
    enum: ['payment_in_progress', 'order_accepted', 'order_in_progress', 'order_completed', 'order_cancelled', 'processed'],
    default: 'payment_in_progress'
  },
  payment_reference_code: {
    type: String,
    required: true,
    default: 'PAY_DEFAULT',
  },
  discount_coupon: {
    type: String,
    required: false,
    default: null,
  },
  discount_amount: {
    type: Number,
    required: false,
    default: 0,
  },
  original_amount: {
    type: Number,
    required: true,
  },
  final_amount: {
    type: Number,
    required: true,
  },
  user: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
