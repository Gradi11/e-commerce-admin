const multer = require('multer');

// Use memory storage instead of disk storage for ImgBB integration
const storage = multer.memoryStorage();

// File filter function to validate image types
const fileFilter = (req, file, cb) => {
    // Check file mimetype
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Initialize multer with memory storage configuration
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 6 // Maximum 6 files for products
    }
});

module.exports = upload;
