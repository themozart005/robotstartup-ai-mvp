// backend/src/middleware/auth.js
// Protects routes - makes sure user is logged in

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Protect routes - require authentication
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')) {
    // Extract token from "Bearer TOKEN_HERE"
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token, user is not logged in
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized - please log in' 
    });
  }

  try {
    // Verify token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database (without password)
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update last active time
    req.user.lastActive = new Date();
    await req.user.save();

    // User is authenticated, continue to next middleware
    next();

  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token - please log in again' 
    });
  }
};

/**
 * Check if user has access to specific feature
 */
const checkEntitlement = (feature) => {
  return (req, res, next) => {
    // User must be authenticated first
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if user has the feature
    if (!req.user.hasAccess(feature)) {
      return res.status(403).json({ 
        success: false, 
        message: `This feature requires ${feature}. Please upgrade to Premium!`,
        upgradeUrl: '/subscription'
      });
    }

    next();
  };
};

/**
 * Restrict to parent accounts only
 */
const parentOnly = (req, res, next) => {
  if (!req.user || req.user.accountType !== 'parent') {
    return res.status(403).json({ 
      success: false, 
      message: 'Only parent accounts can perform this action' 
    });
  }
  next();
};

module.exports = { 
  protect, 
  checkEntitlement, 
  parentOnly 
};