const express = require('express');
const { 
  order, 
  orders, 
  updateOrderPayment,
  applyDiscountToOrder,
  getOrderWithDiscount,
  createOrderWithAmounts
} = require('../controllers/OrderController'); 
const isAuthenticated = require('../middleware/auth');

const router = express.Router();

router.post('/order', isAuthenticated, order); 
router.get('/orders', isAuthenticated, orders); // This is for fetching the orders of the logged-in user

// Update Order Payment API
router.put('/update-payment', updateOrderPayment);

// Discount related routes
router.post('/apply-discount', applyDiscountToOrder);
router.get('/order/:orderId/discount', getOrderWithDiscount);
router.post('/order-with-amounts', createOrderWithAmounts);

module.exports = router;
