const express = require('express');
const { register, login, forgotPassword, resetPassword, getProfile, logout } = require('../controllers/AuthController');
const isAuthenticated = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);
router.get('/profile', isAuthenticated, getProfile);
router.post('/logout', isAuthenticated, logout);

module.exports = router;
