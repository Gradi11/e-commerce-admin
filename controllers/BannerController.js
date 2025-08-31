const Banner = require('../models/Banner');
const fs = require('fs');
const path = require('path');

// Get all banners
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching banners'
    });
  }
};

// Add new banner
exports.addBanner = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    const { title, status } = req.body;
    
    if (!title || !req.file) {
      console.log('Missing required fields - Title:', title, 'File:', !!req.file);
      return res.status(400).json({
        success: false,
        message: 'Title and image are required'
      });
    }

    const banner = new Banner({
      title,
      status: status || 'active',
      image: req.file.filename
    });

    console.log('Saving banner:', banner);
    await banner.save();

    res.status(201).json({
      success: true,
      message: 'Banner added successfully',
      data: banner
    });
  } catch (error) {
    console.error('Error adding banner:', error.message, error.stack);
    res.status(500).json({
      success: false,
      message: `Error adding banner: ${error.message}`
    });
  }
};

// Update banner
exports.updateBanner = async (req, res) => {
  try {
    const { title, status } = req.body;
    const bannerId = req.params.id;

    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    const updateData = { 
      title,
      status: status || banner.status || 'active'
    };

    // Handle image update if new file is uploaded
    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(__dirname, '../public/uploads', banner.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      updateData.image = req.file.filename;
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: updatedBanner
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating banner'
    });
  }
};

// Delete banner
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Delete image file
    const imagePath = path.join(__dirname, '../public/uploads', banner.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting banner'
    });
  }
};

// Add this new function to get active banners for mobile
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ status: 'active' })
      .select('title image') // Only select needed fields
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching mobile banners:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching banners'
    });
  }
}; 