const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ status: 'error', message: 'No token, authorization denied' });
    }

    try {
        const tokenWithoutBearer = token.replace('Bearer ', ''); // Removing 'Bearer ' part from the token

        const decoded = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);  // Verifying token
        const user = await User.findById(decoded.id);  // Finding the user by ID from token payload
        
        if (!user || !user.isLogged) {
            return res.status(401).json({ status: 'error', message: 'User is not logged in' });
        }
        
        req.user = user;  // Store the user in the request object
        next();  // Allow the request to continue
    } catch (err) {
        return res.status(401).json({ status: 'error', message: 'Token is not valid or expired' });
    }
};

module.exports = isAuthenticated;
