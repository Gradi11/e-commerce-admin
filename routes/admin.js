const express = require('express');
const { getUsers, updateUser, deleteUser, getTotalUsers, getActiveUsers } = require('../controllers/AuthController');
const { getUserOrders, getTotalRevenue, getOrderStatus, getTotalOrders, updateOrderStatus, addOrder } = require('../controllers/OrderController');
const authenticateToken = require('../middleware/authMiddleware');  // Import the middleware
const { getProducts } = require('../controllers/ProductController');
const multer = require('multer');
const path = require('path');
const { getBanners, addBanner, updateBanner, deleteBanner, getActiveBanners } = require('../controllers/BannerController');

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/banners');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Apply middleware to routes that need protection
router.get('/users', authenticateToken, getUsers); 
router.put('/users/:id', authenticateToken, updateUser);
router.delete('/users/:id', authenticateToken, deleteUser);

router.get('/total-users', authenticateToken, getTotalUsers);
router.get('/active-users', authenticateToken, getActiveUsers);
router.get('/total-revenue', authenticateToken, getTotalRevenue);

router.get('/order-status', authenticateToken, getOrderStatus);

// Route for getting Total Orders
router.get('/total-orders', authenticateToken, getTotalOrders);

router.get('/orders', authenticateToken, getUserOrders);

router.patch('/orders/:id/status', authenticateToken, updateOrderStatus);

router.post('/orders/add', authenticateToken, addOrder);

router.get('/products', authenticateToken, getProducts);

// Banner routes
router.get('/banners', authenticateToken, getBanners);
router.post('/banners', authenticateToken, upload.single('image'), addBanner);
router.put('/banners/:id', authenticateToken, upload.single('image'), updateBanner);
router.delete('/banners/:id', authenticateToken, deleteBanner);

router.get('/active_banners', getActiveBanners); // No authentication required for public access

module.exports = router;
