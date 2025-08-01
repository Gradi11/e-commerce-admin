const Category = require('../models/Category');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for category image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/categories';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
}).single('image');

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
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: 'File upload error: ' + err.message
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

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
            if (req.file) {
                categoryData.image = req.file.filename;
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
    });
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

        // Delete image file if exists
        if (category.image) {
            const imagePath = path.join(__dirname, '..', 'public', 'uploads', 'categories', category.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

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
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: 'File upload error: ' + err.message
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

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
            if (req.file) {
                // Delete old image if exists
                if (currentCategory.image) {
                    const oldImagePath = path.join(__dirname, '..', 'public', 'uploads', 'categories', currentCategory.image);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
                updateData.image = req.file.filename;
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
    });
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