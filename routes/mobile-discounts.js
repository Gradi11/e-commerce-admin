const express = require('express');
const router = express.Router();
const DiscountController = require('../controllers/DiscountController');

// Mobile API: Validate discount code with order details
router.post('/validate', DiscountController.validateDiscountForMobile);

// Mobile API: Apply discount and update usage
router.post('/apply', DiscountController.applyDiscount);

module.exports = router; 