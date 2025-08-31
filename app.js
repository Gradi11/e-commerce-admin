const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const colors = require('colors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');
const discountRoutes = require('./routes/discounts');
const mobileDiscountRoutes = require('./routes/mobile-discounts');
const fs = require('fs');


dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/public/uploads/products', express.static(path.join(__dirname, 'public/uploads/products')));
app.use('/public/uploads/banners', express.static(path.join(__dirname, 'public/uploads/banners')));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const productsUploadDir = path.join(__dirname, 'public/uploads/products');
if (!fs.existsSync(productsUploadDir)) {
    fs.mkdirSync(productsUploadDir, { recursive: true });
}

const bannersUploadDir = path.join(__dirname, 'public/uploads/banners');
if (!fs.existsSync(bannersUploadDir)) {
    fs.mkdirSync(bannersUploadDir, { recursive: true });
}

// Database connection
connectDB().catch((err) => {
    console.error(`Database connection error: ${err.message}`.red);
    process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/discounts', discountRoutes);
app.use('/api/mobile/discounts', mobileDiscountRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port: `.rainbow.bold, `${PORT}`.bold.red);
});
