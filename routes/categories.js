const express = require('express');
const router = express.Router();
const { 
    getAllCategories, 
    createCategory, 
    deleteCategory, 
    updateCategory,
    getCategory,
    getCategoryNames
} = require('../controllers/CategoryController');
const authenticateToken = require('../middleware/authMiddleware');
const isAuthenticated = require('../middleware/auth');


// Protected route for category names
router.get('/names', isAuthenticated,getCategoryNames);

// Protected routes
router.get('/', authenticateToken, getAllCategories);
router.get('/:id', authenticateToken, getCategory);
router.post('/', authenticateToken,createCategory);
router.delete('/:id', authenticateToken, deleteCategory);
router.put('/:id',authenticateToken, updateCategory);

module.exports = router; 