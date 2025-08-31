const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Otp = require('../models/Otp');

// Register
exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ status: 'success', message: 'User registered successfully', token });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

// Login
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
        }

        // Set the user as logged in
        user.isLogged = true;
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ status: 'success', message: 'Login successful', token });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: errors.array() });
    }

    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await Otp.findOneAndUpdate(
            { email },
            { otp, expiresAt },
            { upsert: true, new: true }
        );

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}`,
        });

        res.json({ status: 'success', message: 'OTP sent to your email' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: errors.array() });
    }

    const { otp, password } = req.body;

    try {
        const otpRecord = await Otp.findOne({ otp, expiresAt: { $gt: new Date() } });
        if (!otpRecord) {
            return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
        }

        const user = await User.findOne({ email: otpRecord.email });
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        user.password = await bcrypt.hash(password, 10);
        await user.save();

        await Otp.deleteOne({ otp });

        res.json({ status: 'success', message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

// Profile (Fetch User Data)
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.json({ status: 'success', data: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

// Logout
exports.logout = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);  // Get user from request object after middleware validation
        
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        // Set the user as logged out
        user.isLogged = false;
        await user.save();

        res.json({ status: 'success', message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

// Backend

// Fetch all users with search and filter
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        
        res.json({
            success: true,
            message: 'Users fetched successfully',
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// Update user by ID
exports.updateUser = async (req, res) => {
    try {
        const { name, email, password, isLogged } = req.body;
        const userId = req.params.id;

        // Validate input
        if (!name || !email) {
            return res.status(400).json({
                status: 'error',
                message: 'Name and email are required'
            });
        }

        // Check if user exists
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Create update object
        let updateData = {
            name,
            email,
            isLogged: isLogged === 'true' || isLogged === true
        };

        // If password is provided, hash it
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            status: 'success',
            message: 'User updated successfully',
            data: updatedUser
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error updating user'
        });
    }
};

// Delete user by ID
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.status(200).json({ status: 'success', message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Error deleting user' });
    }
};

// Fetch total users
exports.getTotalUsers = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments(); // Count the total number of users
        res.status(200).json({ status: 'success', data: totalUsers });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Error fetching total users' });
    }
};

// Controller to fetch active users (users with isLogged: true)
exports.getActiveUsers = async (req, res) => {
    try {
        // Count users with isLogged: true
        const activeUsers = await User.countDocuments({ isLogged: true });

        // Return the count of active users
        res.json({ status: 'success', data: activeUsers });
    } catch (err) {
        console.error('Error fetching active users:', err);
        res.status(500).json({ status: 'error', message: 'Server Error' });
    }
};


