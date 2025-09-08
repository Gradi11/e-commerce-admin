// middleware/authMiddleware.js
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>
  
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
  
    // Decode and validate the token
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [username, timestamp] = decoded.split(':');
  
      
  
      // Check if the username matches and token is recent enough (case insensitive)
      if ((username.toLowerCase() === 'pakad' || username === 'PAKAD') && Date.now() - parseInt(timestamp) < 3600000) { // token valid for 1 hour
        next(); // Token is valid, allow the request to continue
      } else {
        
        res.status(401).json({ message: 'Invalid or expired token.' });
      }
    } catch (error) {
      
      res.status(401).json({ message: 'Invalid token format.' });
    }
  }
  
  module.exports = authenticateToken;
  