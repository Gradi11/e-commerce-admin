const Order = require('../models/Order');
const Product = require('../models/Product');


exports.order = async (req, res) => {
    try {
      const { 
        items, 
        delivery_address, 
        delivery_option, 
        payment_status, 
        order_status,
        original_amount,
        final_amount,
        discount_amount = 0,
        discount_coupon = null
      } = req.body;

      // Validate input
      if (!items || !Array.isArray(items)) return res.status(400).json({ success: false, message: 'Invalid items.' });
      if (!delivery_address || !delivery_option || !payment_status || !order_status) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
      }

      // Validate enum values
      const validPaymentStatuses = ['pending', 'completed', 'failed', 'card_payment_pending', 'payment_pending', 'mobile_money_pending'];
      const validOrderStatuses = ['payment_in_progress', 'order_accepted', 'order_in_progress', 'order_completed', 'order_cancelled', 'processed'];
      
      if (!validPaymentStatuses.includes(payment_status)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid payment_status. Must be one of: ${validPaymentStatuses.join(', ')}` 
        });
      }
      
      if (!validOrderStatuses.includes(order_status)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid order_status. Must be one of: ${validOrderStatuses.join(', ')}` 
        });
      }

      // Calculate amounts if not provided
      let calculatedOriginalAmount = original_amount;
      let calculatedFinalAmount = final_amount;
      let calculatedDiscountAmount = discount_amount || 0;

      if (!calculatedOriginalAmount) {
        // Calculate from items
        calculatedOriginalAmount = items.reduce((sum, item) => {
          const price = parseFloat(item.price || item.total || 0);
          const quantity = parseInt(item.quantity || 1);
          return sum + (price * quantity);
        }, 0);
      }

      if (!calculatedFinalAmount) {
        calculatedFinalAmount = calculatedOriginalAmount - calculatedDiscountAmount;
      }

      // Ensure amounts are positive
      calculatedOriginalAmount = Math.max(0, calculatedOriginalAmount);
      calculatedFinalAmount = Math.max(0, calculatedFinalAmount);
      calculatedDiscountAmount = Math.max(0, calculatedDiscountAmount);
  
      // Create the order
      const order = new Order({
        items,
        delivery_address,
        delivery_option,
        payment_status,
        order_status,
        original_amount: calculatedOriginalAmount,
        final_amount: calculatedFinalAmount,
        discount_amount: calculatedDiscountAmount,
        discount_coupon,
        user: req.user._id,  // Associate the order with the authenticated user
      });
  
      await order.save();
  
      res.status(201).json({
        success: true,
        message: 'Order placed successfully.',
        data: order,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.orders = async (req, res) => {
  try {
      const userId = req.user._id;  // Get user ID from the token

      const orders = await Order.find({ user: userId });

      if (orders.length === 0) {
          return res.status(404).json({ success: false, message: 'No orders found for this user.' });
      }

      res.status(200).json({
          success: true,
          message: 'Orders fetched successfully.',
          data: orders,
      });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Backend

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find();

    // Add isNew flag based on creation time (e.g. within last 24 hours)
    const ordersWithNewFlag = orders.map(order => {
      const orderObj = order.toObject();
      const isNew = (Date.now() - new Date(order.createdAt).getTime()) < 24 * 60 * 60 * 1000;
      return { ...orderObj, isNew };
    });

    if (!ordersWithNewFlag.length) {
      return res.status(404).json({ success: false, message: 'No orders found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Orders fetched successfully.',
      data: ordersWithNewFlag,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get Total Revenue
exports.getTotalRevenue = async (req, res) => {
  try {
    // Fetch only completed orders
    const orders = await Order.find({ order_status: 'order_completed' });

    // Calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => {
      return sum + order.items.reduce((orderSum, item) => {
        return orderSum + (parseFloat(item.price) * item.quantity);
      }, 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: totalRevenue.toFixed(2), // Keep two decimal points
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get Order Status (Success vs. Cancelled Orders)
exports.getOrderStatus = async (req, res) => {
  try {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
                  successfulOrders: { $sum: { $cond: [{ $eq: ["$order_status", "order_completed"] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ["$order_status", "order_cancelled"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } } // Sort by month
    ]);

    const result = {
      successfulOrders: orders.map(order => order.successfulOrders),
      cancelledOrders: orders.map(order => order.cancelledOrders),
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get Total Orders by Month
exports.getTotalOrders = async (req, res) => {
  try {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } } // Sort by month
    ]);

    const result = {
      totalOrders: orders.map(order => order.totalOrders),
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Add this function to the existing OrderController
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status with new order statuses
    const validStatuses = ['payment_in_progress', 'order_accepted', 'order_in_progress', 'order_completed', 'order_cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Valid statuses are: payment_in_progress, order_accepted, order_in_progress, order_completed, order_cancelled'
      });
    }

    // Find and update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { order_status: status },
      { new: true } // Returns the updated document
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Add new order
exports.addOrder = async (req, res) => {
  try {
    const { 
      productId, 
      quantity, 
      size, 
      color, 
      delivery_address, 
      delivery_option,
      payment_status,
      order_status 
    } = req.body;

    // Validate required fields
    if (!productId || !quantity || !delivery_address || !delivery_option) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Create order without user reference for now
    const order = new Order({
      items: [{
        productId,
        title: product.name,
        quantity,
        price: product.price,
        size,
        color
      }],
      delivery_address,
      delivery_option,
      payment_status: payment_status || 'pending',
      order_status: order_status || 'payment_in_progress',
      // Remove user field or set a default user if needed
      user: req.user?._id || '64a545b1c0d0e2a2c5c39c44' // Add a default admin user ID here
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order added successfully',
      data: order
    });

  } catch (error) {
    console.error('Error adding order:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding order',
      error: error.message
    });
  }
};

// Update Order Payment
exports.updateOrderPayment = async (req, res) => {
  try {
    const { payment_reference_code } = req.body;

    // Find the most recent order to update
    const latestOrder = await Order.findOne().sort({ createdAt: -1 });

    if (!latestOrder) {
      return res.status(404).json({
        success: false,
        message: 'No orders found to update'
      });
    }

    // Set default value if no payment_reference_code provided
    const referenceCode = payment_reference_code || 'PAY_DEFAULT';

    // Only update payment_reference_code, nothing else
    const updatedOrder = await Order.findByIdAndUpdate(
      latestOrder._id,
      { payment_reference_code: referenceCode },
      { new: true } // Returns the updated document
    );

    res.status(200).json({
      success: true,
      message: 'Payment reference code updated successfully',
      data: updatedOrder
    });

  } catch (error) {
    console.error('Error updating payment reference code:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment reference code',
      error: error.message
    });
  }
};

// Apply discount to order
exports.applyDiscountToOrder = async (req, res) => {
  try {
    const { orderId, discountCode, originalAmount } = req.body;

    if (!orderId || !discountCode || !originalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, discount code, and original amount are required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate discount code using the discount service
    const Discount = require('../models/Discount');
    const discount = await Discount.findOne({ code: discountCode.toUpperCase() });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Invalid discount code'
      });
    }

    // Check if discount is valid
    const now = new Date();
    if (!discount.isActive || 
        discount.startDate > now || 
        discount.endDate < now ||
        (discount.maxUsage && discount.usedCount >= discount.maxUsage)) {
      
      return res.status(400).json({
        success: false,
        message: 'Discount code is not valid or has expired'
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (originalAmount * discount.value) / 100;
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount;
      }
    } else {
      discountAmount = discount.value;
    }

    const finalAmount = originalAmount - discountAmount;

    // Update order with discount information
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        discount_coupon: discountCode.toUpperCase(),
        discount_amount: discountAmount,
        original_amount: originalAmount,
        final_amount: finalAmount
      },
      { new: true }
    );

    // Update discount usage count
    discount.usedCount += 1;
    await discount.save();

    res.json({
      success: true,
      message: 'Discount applied successfully',
      data: {
        order: updatedOrder,
        discount: {
          code: discount.code,
          name: discount.name,
          type: discount.type,
          value: discount.value
        },
        calculation: {
          originalAmount: originalAmount,
          discountAmount: discountAmount,
          finalAmount: finalAmount,
          savingsPercentage: originalAmount > 0 ? ((discountAmount / originalAmount) * 100).toFixed(2) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error applying discount to order:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying discount to order',
      error: error.message
    });
  }
};

// Get order with discount details
exports.getOrderWithDiscount = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        order: order,
        discountApplied: order.discount_coupon ? {
          coupon: order.discount_coupon,
          amount: order.discount_amount,
          savings: order.original_amount > 0 ? 
            ((order.discount_amount / order.original_amount) * 100).toFixed(2) : 0
        } : null
      }
    });

  } catch (error) {
    console.error('Error getting order with discount:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting order with discount',
      error: error.message
    });
  }
};

// Update order creation to include amount fields
exports.createOrderWithAmounts = async (req, res) => {
  try {
    const { 
      items, 
      delivery_address, 
      delivery_option, 
      payment_status, 
      order_status,
      discount_coupon = null,
      original_amount,
      final_amount,
      discount_amount = 0
    } = req.body;



    // Validate input
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid items.' 
      });
    }
    
    if (!delivery_address || !delivery_option || !payment_status || !order_status) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required.' 
      });
    }

    // Remove the validation for amount fields since they're now optional

    // Set default amounts if not provided
    let calculatedOriginalAmount = original_amount || 0;
    let calculatedFinalAmount = final_amount || 0;
    let calculatedDiscountAmount = discount_amount || 0;

    if (calculatedOriginalAmount === 0) {
      // Calculate from items
      calculatedOriginalAmount = items.reduce((sum, item) => {
        const price = parseFloat(item.price || item.total || 0);
        const quantity = parseInt(item.quantity || 1);
        return sum + (price * quantity);
      }, 0);
    }

    if (calculatedFinalAmount === 0) {
      calculatedFinalAmount = calculatedOriginalAmount - calculatedDiscountAmount;
    }

    // Ensure amounts are positive
    calculatedOriginalAmount = Math.max(0, calculatedOriginalAmount);
    calculatedFinalAmount = Math.max(0, calculatedFinalAmount);
    calculatedDiscountAmount = Math.max(0, calculatedDiscountAmount);



    // Create the order
    const order = new Order({
      items,
      delivery_address,
      delivery_option,
      payment_status,
      order_status,
      discount_coupon,
      discount_amount: calculatedDiscountAmount,
      original_amount: calculatedOriginalAmount,
      final_amount: calculatedFinalAmount,
      user: req.user?._id || '64a545b1c0d0e2a2c5c39c44'
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};
