const Discount = require('../models/Discount');
const Product = require('../models/Product');

class DiscountController {
    // Create new discount
    async createDiscount(req, res) {
        try {
            const {
                code,
                name,
                description,
                type,
                value,
                maxDiscount,
                minOrderAmount,
                maxUsage,
                applicableProducts,
                applicableCategories,
                startDate,
                endDate,
                isActive,
                isFirstTimeOnly
            } = req.body;

            // Validate required fields
            if (!code || !name || !type || !value || !startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Check if discount code already exists
            const existingDiscount = await Discount.findOne({ code: code.toUpperCase() });
            if (existingDiscount) {
                return res.status(400).json({
                    success: false,
                    message: 'Discount code already exists'
                });
            }

            // Validate dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (start >= end) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }

            // Validate value based on type
            if (type === 'percentage' && (value <= 0 || value > 100)) {
                return res.status(400).json({
                    success: false,
                    message: 'Percentage value must be between 1 and 100'
                });
            }

            if (type === 'fixed' && value <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Fixed discount value must be greater than 0'
                });
            }

            // Create discount
            const discount = new Discount({
                code: code.toUpperCase(),
                name,
                description,
                type,
                value,
                maxDiscount,
                minOrderAmount: minOrderAmount || 0,
                maxUsage,
                applicableProducts: applicableProducts || [],
                applicableCategories: applicableCategories || [],
                startDate: start,
                endDate: end,
                isActive: isActive !== undefined ? isActive : true,
                isFirstTimeOnly: isFirstTimeOnly || false
            });

            await discount.save();

            res.status(201).json({
                success: true,
                message: 'Discount created successfully',
                data: discount
            });

        } catch (error) {
            console.error('Error creating discount:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get all discounts with pagination and search
    async getAllDiscounts(req, res) {
        try {
            const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
            const skip = (page - 1) * limit;

            // Build query
            let query = {};
            
            if (search) {
                query.$or = [
                    { code: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            if (status === 'active') {
                query.isActive = true;
            } else if (status === 'inactive') {
                query.isActive = false;
            }

            // Get discounts with pagination
            const discounts = await Discount.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('applicableProducts', 'name price');

            // Get total count
            const total = await Discount.countDocuments(query);

            res.json({
                success: true,
                data: discounts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Error fetching discounts:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get single discount by ID
    async getDiscountById(req, res) {
        try {
            const { id } = req.params;

            const discount = await Discount.findById(id)
                .populate('applicableProducts', 'name price category');

            if (!discount) {
                return res.status(404).json({
                    success: false,
                    message: 'Discount not found'
                });
            }

            res.json({
                success: true,
                data: discount
            });

        } catch (error) {
            console.error('Error fetching discount:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update discount
    async updateDiscount(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Check if discount exists
            const discount = await Discount.findById(id);
            if (!discount) {
                return res.status(404).json({
                    success: false,
                    message: 'Discount not found'
                });
            }

            // If code is being updated, check for duplicates
            if (updateData.code && updateData.code !== discount.code) {
                const existingDiscount = await Discount.findOne({ 
                    code: updateData.code.toUpperCase(),
                    _id: { $ne: id }
                });
                
                if (existingDiscount) {
                    return res.status(400).json({
                        success: false,
                        message: 'Discount code already exists'
                    });
                }
                
                updateData.code = updateData.code.toUpperCase();
            }

            // Validate dates if being updated
            if (updateData.startDate && updateData.endDate) {
                const start = new Date(updateData.startDate);
                const end = new Date(updateData.endDate);
                
                if (start >= end) {
                    return res.status(400).json({
                        success: false,
                        message: 'End date must be after start date'
                    });
                }
            }

            // Validate value if being updated
            if (updateData.value !== undefined) {
                if (updateData.type === 'percentage' && (updateData.value <= 0 || updateData.value > 100)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Percentage value must be between 1 and 100'
                    });
                }

                if (updateData.type === 'fixed' && updateData.value <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Fixed discount value must be greater than 0'
                    });
                }
            }

            // Update discount
            const updatedDiscount = await Discount.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: Date.now() },
                { new: true, runValidators: true }
            ).populate('applicableProducts', 'name price category');

            res.json({
                success: true,
                message: 'Discount updated successfully',
                data: updatedDiscount
            });

        } catch (error) {
            console.error('Error updating discount:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete discount
    async deleteDiscount(req, res) {
        try {
            const { id } = req.params;

            const discount = await Discount.findByIdAndDelete(id);

            if (!discount) {
                return res.status(404).json({
                    success: false,
                    message: 'Discount not found'
                });
            }

            res.json({
                success: true,
                message: 'Discount deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting discount:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Toggle discount status
    async toggleDiscountStatus(req, res) {
        try {
            const { id } = req.params;

            const discount = await Discount.findById(id);
            if (!discount) {
                return res.status(404).json({
                    success: false,
                    message: 'Discount not found'
                });
            }

            discount.isActive = !discount.isActive;
            await discount.save();

            res.json({
                success: true,
                message: `Discount ${discount.isActive ? 'activated' : 'deactivated'} successfully`,
                data: discount
            });

        } catch (error) {
            console.error('Error toggling discount status:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get discount statistics
    async getDiscountStats(req, res) {
        try {
            const totalDiscounts = await Discount.countDocuments();
            const activeDiscounts = await Discount.countDocuments({ isActive: true });
            const expiredDiscounts = await Discount.countDocuments({
                endDate: { $lt: new Date() }
            });
            const upcomingDiscounts = await Discount.countDocuments({
                startDate: { $gt: new Date() }
            });

            res.json({
                success: true,
                data: {
                    total: totalDiscounts,
                    active: activeDiscounts,
                    expired: expiredDiscounts,
                    upcoming: upcomingDiscounts
                }
            });

        } catch (error) {
            console.error('Error fetching discount stats:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Validate discount code (for frontend validation)
    async validateDiscountCode(req, res) {
        try {
            const { code } = req.params;

            const discount = await Discount.findOne({ code: code.toUpperCase() })
                .populate('applicableProducts', 'name price category');

            if (!discount) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid discount code'
                });
            }

            // Check if discount is valid
            const now = new Date();
            const isValid = discount.isActive && 
                          discount.startDate <= now && 
                          discount.endDate >= now &&
                          (!discount.maxUsage || discount.usedCount < discount.maxUsage);

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Discount code is not valid or has expired'
                });
            }

            res.json({
                success: true,
                data: discount
            });

        } catch (error) {
            console.error('Error validating discount code:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Mobile API: Validate discount code with order details
    async validateDiscountForMobile(req, res) {
        try {
            const { 
                code, 
                orderAmount = 0, 
                userId = null, 
                productIds = [],
                categoryIds = []
            } = req.body;

            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Discount code is required'
                });
            }

            // Find discount by code
            const discount = await Discount.findOne({ code: code.toUpperCase() })
                .populate('applicableProducts', 'name price category');

            if (!discount) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid discount code',
                    data: null
                });
            }

            // Check if discount is active
            if (!discount.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'This discount code is currently inactive',
                    data: null
                });
            }

            // Check validity period
            const now = new Date();
            if (discount.startDate > now) {
                return res.status(400).json({
                    success: false,
                    message: 'This discount code is not yet active',
                    data: null
                });
            }

            if (discount.endDate < now) {
                return res.status(400).json({
                    success: false,
                    message: 'This discount code has expired',
                    data: null
                });
            }

            // Check usage limits
            if (discount.maxUsage && discount.usedCount >= discount.maxUsage) {
                return res.status(400).json({
                    success: false,
                    message: 'This discount code has reached its usage limit',
                    data: null
                });
            }

            // Check minimum order amount
            if (discount.minOrderAmount > 0 && orderAmount < discount.minOrderAmount) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum order amount of $${discount.minOrderAmount} required`,
                    data: null
                });
            }

            // Check if first-time only
            if (discount.isFirstTimeOnly && userId) {
                // Here you would check if user has made any previous orders
                // For now, we'll assume it's valid
                // You can implement user order history check here
            }

            // Check applicable products/categories
            let isApplicable = true;
            let applicableMessage = '';

            if (discount.applicableProducts.length > 0) {
                const applicableProductIds = discount.applicableProducts.map(p => p._id.toString());
                const hasApplicableProduct = productIds.some(productId => 
                    applicableProductIds.includes(productId)
                );
                
                if (!hasApplicableProduct) {
                    isApplicable = false;
                    applicableMessage = 'This discount is only applicable to specific products';
                }
            }

            if (discount.applicableCategories.length > 0) {
                const hasApplicableCategory = categoryIds.some(categoryId => 
                    discount.applicableCategories.includes(categoryId)
                );
                
                if (!hasApplicableCategory) {
                    isApplicable = false;
                    applicableMessage = 'This discount is only applicable to specific categories';
                }
            }

            if (!isApplicable) {
                return res.status(400).json({
                    success: false,
                    message: applicableMessage,
                    data: null
                });
            }

            // Calculate discount amount
            let discountAmount = 0;
            let finalAmount = orderAmount;

            if (discount.type === 'percentage') {
                discountAmount = (orderAmount * discount.value) / 100;
                if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
                    discountAmount = discount.maxDiscount;
                }
            } else {
                discountAmount = discount.value;
            }

            finalAmount = orderAmount - discountAmount;

            // Prepare response data
            const responseData = {
                discount: {
                    id: discount._id,
                    code: discount.code,
                    name: discount.name,
                    description: discount.description,
                    type: discount.type,
                    value: discount.value,
                    maxDiscount: discount.maxDiscount,
                    minOrderAmount: discount.minOrderAmount,
                    isFirstTimeOnly: discount.isFirstTimeOnly
                },
                calculation: {
                    originalAmount: orderAmount,
                    discountAmount: discountAmount,
                    finalAmount: finalAmount,
                    discountPercentage: discount.type === 'percentage' ? discount.value : null,
                    savingsPercentage: orderAmount > 0 ? ((discountAmount / orderAmount) * 100).toFixed(2) : 0
                },
                validity: {
                    startDate: discount.startDate,
                    endDate: discount.endDate,
                    isActive: discount.isActive,
                    usedCount: discount.usedCount,
                    maxUsage: discount.maxUsage
                }
            };

            res.json({
                success: true,
                message: 'Discount code applied successfully',
                data: responseData
            });

        } catch (error) {
            console.error('Error validating discount for mobile:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                data: null
            });
        }
    }

    // Apply discount and update usage count
    async applyDiscount(req, res) {
        try {
            const { 
                code, 
                orderAmount, 
                userId = null,
                orderId = null
            } = req.body;

            if (!code || !orderAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'Discount code and order amount are required'
                });
            }

            // Find and validate discount
            const discount = await Discount.findOne({ code: code.toUpperCase() });

            if (!discount) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid discount code'
                });
            }

            // Validate discount (same logic as validateDiscountForMobile)
            const now = new Date();
            if (!discount.isActive || 
                discount.startDate > now || 
                discount.endDate < now ||
                (discount.maxUsage && discount.usedCount >= discount.maxUsage) ||
                (discount.minOrderAmount > 0 && orderAmount < discount.minOrderAmount)) {
                
                return res.status(400).json({
                    success: false,
                    message: 'Discount code is not valid for this order'
                });
            }

            // Calculate discount
            let discountAmount = 0;
            if (discount.type === 'percentage') {
                discountAmount = (orderAmount * discount.value) / 100;
                if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
                    discountAmount = discount.maxDiscount;
                }
            } else {
                discountAmount = discount.value;
            }

            const finalAmount = orderAmount - discountAmount;

            // Update usage count
            discount.usedCount += 1;
            await discount.save();

            res.json({
                success: true,
                message: 'Discount applied successfully',
                data: {
                    discountId: discount._id,
                    discountCode: discount.code,
                    originalAmount: orderAmount,
                    discountAmount: discountAmount,
                    finalAmount: finalAmount,
                    appliedAt: new Date()
                }
            });

        } catch (error) {
            console.error('Error applying discount:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

module.exports = new DiscountController(); 