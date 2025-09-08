const Category = require('../models/Category');
const { uploadToImgBB } = require('../config/imgbbConfig');

// Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Create new category
exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        // Validate input
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({ name: name.trim() });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category already exists'
            });
        }

        // Create category data
        const categoryData = {
            name: name.trim()
        };

        // Add image path if file was uploaded
        if (req.file && req.file.buffer) {
            const imgbbResult = await uploadToImgBB(req.file.buffer, req.file.originalname);
            if (imgbbResult.success) {
                categoryData.image = imgbbResult.url;
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading image to ImgBB: ' + imgbbResult.error
                });
            }
        }

        // Create new category
        const category = new Category(categoryData);
        await category.save();

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Note: We can't delete image from ImgBB anymore since we don't store deleteUrl
        // ImgBB will automatically clean up unused images

        await Category.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { name } = req.body;

        // Validate input
        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        // Check if new name already exists for other category
        const existingCategory = await Category.findOne({
            name: name.trim(),
            _id: { $ne: req.params.id }
        });
        
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category name already exists'
            });
        }

        // Get current category to check for existing image
        const currentCategory = await Category.findById(req.params.id);
        if (!currentCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Prepare update data
        const updateData = { name: name.trim() };

        // Handle image update
        if (req.file && req.file.buffer) {
            // Note: We can't delete old image from ImgBB anymore since we don't store deleteUrl
            // ImgBB will automatically clean up unused images
            
            const imgbbResult = await uploadToImgBB(req.file.buffer, req.file.originalname);
            if (imgbbResult.success) {
                updateData.image = imgbbResult.url;
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading image to ImgBB: ' + imgbbResult.error
                });
            }
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Category updated successfully',
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// Get single category
exports.getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category',
            error: error.message
        });
    }
};

// Get category names only
exports.getCategoryNames = async (req, res) => {
    try {
        const categories = await Category.find().select('name image').sort({ name: 1 });
        const categoryData = categories.map(category => ({
            name: category.name,
            image: category.image
        }));
        
        res.json({
            success: true,
            categories: categoryData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category names',
            error: error.message
        });
    }
}; 