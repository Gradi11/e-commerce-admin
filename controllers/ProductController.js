const path = require('path');
const Product = require('../models/Product');

// Create product with image handling
exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, salePrice, stock } = req.body;
        
        // Parse categories, colors and sizes from JSON strings
        let categories = [];
        let colors = [];
        let sizes = [];
        try {
            categories = JSON.parse(req.body.category);
            colors = JSON.parse(req.body.colors);
            sizes = JSON.parse(req.body.sizes);
        } catch (e) {
            console.error('Error parsing categories/colors/sizes:', e);
        }

        // Validate required fields
        if (!name || !categories || categories.length === 0 || !description || !price || !stock) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields including at least one category'
            });
        }

        // Create product data object
        const productData = {
            name,
            category: categories,
            description,
            price: Number(price),
            stock: Number(stock),
            colors,
            sizes
        };

        // Add sale price if provided
        if (salePrice && salePrice !== 'null') {
            productData.salePrice = Number(salePrice);
        }

        // Add images if uploaded
        if (req.files && req.files.length > 0) {
            productData.images = req.files.map(file => file.filename);
        }

        // Create new product
        const newProduct = new Product(productData);
        await newProduct.save();

        res.status(201).json({
            status: 'success',
            message: 'Product created successfully',
            data: newProduct
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal server error'
        });
    }
};

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ status: 'success', data: products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

// Get a product by its ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }
        res.json({ status: 'success', data: product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { name, description, price, salePrice, stock } = req.body;
        let categories = [];
        let colors = [];
        let sizes = [];
        
        try {
            categories = JSON.parse(req.body.category);
            colors = JSON.parse(req.body.colors);
            sizes = JSON.parse(req.body.sizes);
        } catch (e) {
            console.error('Error parsing categories/colors/sizes:', e);
        }

        const updateData = {
            name,
            category: categories,
            description,
            price: Number(price),
            stock: Number(stock),
            colors,
            sizes
        };

        // Handle salePrice
        if (salePrice && salePrice !== 'null') {
            updateData.salePrice = Number(salePrice);
        } else {
            updateData.salePrice = null;
        }

        // Handle images if they were uploaded
        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => file.filename);
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Product not found' 
            });
        }

        res.json({ 
            status: 'success', 
            message: 'Product updated successfully', 
            data: updatedProduct 
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error' 
        });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        if (!deletedProduct) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }

        res.json({ status: 'success', message: 'Product deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

// Serve Add Product page (HTML form)
exports.addProductPage = async (req, res) => {
    res.sendFile(path.join(__dirname, '../public', '/addProduct/index.html'));
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
};
