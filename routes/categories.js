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
const upload = require('../config/multerConfig'); // Use the ImgBB multer configuration

// Protected route for category names
router.get('/names', isAuthenticated, getCategoryNames);

// Protected routes
router.get('/', authenticateToken, getAllCategories);
router.get('/:id', authenticateToken, getCategory);
router.post('/', authenticateToken, upload.single('image'), createCategory);
router.delete('/:id', authenticateToken, deleteCategory);
router.put('/:id', authenticateToken, upload.single('image'), updateCategory);

module.exports = router; 