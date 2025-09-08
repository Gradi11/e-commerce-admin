const express = require('express');
const { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, addProductPage } = require('../controllers/ProductController');
const upload = require('../config/multerConfig'); // Use the ImgBB multer configuration
const authenticateToken = require('../middleware/authMiddleware');  // Import the middleware

const router = express.Router();

router.post('/', upload.array('images', 6), createProduct);  // Use multer middleware for multiple file upload
router.get('/', getAllProducts);
router.get('/add', addProductPage);
router.get('/:id', getProductById);
router.put('/:id', upload.array('images', 6), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;

