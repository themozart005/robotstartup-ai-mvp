// backend/src/routes/authRoutes.js
// Handles user registration, login, and account management

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, parentOnly } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new parent account
 * @access  Public
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName').trim().notEmpty().withMessage('Display name required')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  try {
    const { email, password, displayName } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered. Please log in instead.' 
      });
    }

    // Create parent account
    user = new User({
      email,
      password, // Will be hashed automatically by User model
      accountType: 'parent',
      profile: { displayName }
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    logger.info(`👤 New parent account created: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.profile.displayName,
        accountType: user.accountType,
        subscription: user.subscription,
        entitlements: user.entitlements
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

/**
 * @route   POST /api/auth/register-teacher
 * @desc    Register a new teacher account
 * @access  Public
 */
router.post('/register-teacher', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName').trim().notEmpty().withMessage('Display name required'),
  body('schoolName').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  try {
    const { email, password, displayName, schoolName } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered. Please log in instead.' 
      });
    }

    // Create teacher account
    user = new User({
      email,
      password,
      accountType: 'teacher',
      profile: { 
        displayName,
        schoolName: schoolName || null
      }
    });

    await user.save();

    const token = generateToken(user._id);

    logger.info(`👨‍🏫 New teacher account created: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Teacher account created! Subscribe to unlock classroom features.',
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.profile.displayName,
        accountType: user.accountType,
        subscription: user.subscription,
        entitlements: user.entitlements
      }
    });

  } catch (error) {
    logger.error('Teacher registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});


/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    logger.info(`🔐 User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.profile.displayName,
        accountType: user.accountType,
        subscription: user.subscription,
        entitlements: user.entitlements
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.profile.displayName,
        accountType: req.user.accountType,
        subscription: req.user.subscription,
        entitlements: req.user.entitlements,
        gameProgress: req.user.gameProgress
      }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * @route   POST /api/auth/create-child
 * @desc    Parent creates child account (COPPA compliant)
 * @access  Private (Parent only)
 */
router.post('/create-child', [
  protect,
  (req, res, next) => {
    if (req.user.accountType !== 'parent' && req.user.accountType !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only parents and teachers can create child/student accounts' 
      });
    }
    next();
  },
  body('displayName').trim().notEmpty().withMessage('Display name required'),
  body('age').optional().isInt({ min: 5, max: 18 }).withMessage('Age must be between 5 and 18')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  try {
    const { displayName, age, grade } = req.body;
    const parentId = req.user._id;

    // Check subscription limits
    const childCount = await User.countDocuments({ parentId });
    
    if (childCount >= req.user.entitlements.maxChildren) {
      return res.status(403).json({ 
        success: false, 
        message: `You can have up to ${req.user.entitlements.maxChildren} child account(s). Upgrade to Premium for more!`,
        upgradeUrl: '/subscription'
      });
    }

    // Create child/Student account (no email/password needed for child)
    const accountType = req.user.accountType === 'teacher' ? 'student' : 'child';
	const child = new User({
      email: `${accountType}_${Date.now()}_${parentId}@robostartup.local`,
      password: Math.random().toString(36),
      accountType: accountType, // 'student' for teachers, 'child' for parents
      parentId,
      profile: { 
        displayName, 
        age: age || null, 
        grade: grade || null 
      }
    });

    await child.save();

    logger.info(`👶 Child account created by parent ${parentId}: ${displayName}`);

    res.status(201).json({
      success: true,
      message: `Child account created for ${displayName}!`,
      child: {
        id: child._id,
        displayName: child.profile.displayName,
        age: child.profile.age,
        grade: child.profile.grade,
        parentId: child.parentId
      }
    });

  } catch (error) {
    logger.error('Create child error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating child account' 
    });
  }
});

/**
 * @route   GET /api/auth/my-children
 * @desc    Get all child accounts for logged in parent
 * @access  Private (Parent only)
 */
router.get('/my-children', protect, parentOnly, async (req, res) => {
  try {
    const children = await User.find({ 
      parentId: req.user._id 
    }).select('profile gameProgress createdAt');

    res.json({
      success: true,
      count: children.length,
      maxChildren: req.user.entitlements.maxChildren,
      children: children.map(child => ({
        id: child._id,
        displayName: child.profile.displayName,
        age: child.profile.age,
        grade: child.profile.grade,
        gamesPlayed: child.gameProgress.gamesPlayed,
        bestScore: child.gameProgress.bestScore,
        createdAt: child.createdAt
      }))
    });

  } catch (error) {
    logger.error('Get children error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

/**
 * @route   DELETE /api/auth/child/:childId
 * @desc    Delete a child account
 * @access  Private (Parent only)
 */
router.delete('/child/:childId', protect, parentOnly, async (req, res) => {
  try {
    const { childId } = req.params;

    // Find child and verify it belongs to this parent
    const child = await User.findOne({
      _id: childId,
      parentId: req.user._id,
      accountType: 'child'
    });

    if (!child) {
      return res.status(404).json({ 
        success: false, 
        message: 'Child account not found' 
      });
    }

    await child.deleteOne();

    logger.info(`🗑️ Child account deleted by parent ${req.user._id}: ${childId}`);

    res.json({
      success: true,
      message: 'Child account deleted successfully'
    });

  } catch (error) {
    logger.error('Delete child error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;