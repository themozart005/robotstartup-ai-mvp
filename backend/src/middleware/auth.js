// backend/src/middleware/auth.js
// JWT authentication middleware

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and attach to request
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Attach full user object to request
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

/**
 * Parent-only middleware
 * Checks if user is a parent or teacher
 */
const parentOnly = (req, res, next) => {
  if (req.user.accountType !== 'parent' && req.user.accountType !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Parents or teachers only.'
    });
  }
  next();
};

// Export both names for compatibility
module.exports = { 
  auth,           // For Stripe routes
  protect: auth,  // For Auth routes (same function, different name)
  parentOnly 
};