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
  },
  order_status: {
    type: String,
    required: true,
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
