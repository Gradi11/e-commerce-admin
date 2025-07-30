const express = require('express');
const router = express.Router();
const DiscountController = require('../controllers/DiscountController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin routes with authentication
router.use(authMiddleware);

// Get all discounts with pagination and search
router.get('/', DiscountController.getAllDiscounts);

// Get discount statistics
router.get('/stats', DiscountController.getDiscountStats);

// Get single discount by ID
router.get('/:id', DiscountController.getDiscountById);

// Create new discount
router.post('/', DiscountController.createDiscount);

// Update discount
router.put('/:id', DiscountController.updateDiscount);

// Delete discount
router.delete('/:id', DiscountController.deleteDiscount);

// Toggle discount status
router.patch('/:id/toggle', DiscountController.toggleDiscountStatus);

// Validate discount code
router.get('/validate/:code', DiscountController.validateDiscountCode);

module.exports = router; 