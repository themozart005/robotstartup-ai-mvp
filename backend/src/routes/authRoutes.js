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
        entitlements: user.entitlements,
        gameProgress: user.gameProgress
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
        entitlements: user.entitlements,
        gameProgress: user.gameProgress
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
        entitlements: user.entitlements,
        gameProgress: user.gameProgress
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
 * @desc    Parent/Teacher creates child/student account (COPPA compliant)
 * @access  Private (Parent/Teacher only)
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
  body('age').optional().isInt({ min: 5, max: 18 }).withMessage('Age must be between 5 and 18'),
  body('grade').optional().trim()
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
        message: `You can have up to ${req.user.entitlements.maxChildren} ${req.user.accountType === 'teacher' ? 'student' : 'child'} account(s). Upgrade for more!`,
        upgradeUrl: '/subscription'
      });
    }

    // Generate unique, readable email for child/student
    const accountType = req.user.accountType === 'teacher' ? 'student' : 'child';
    const sanitizedName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const childEmail = `${sanitizedName}.${randomSuffix}@robostartup.student`;

    // Generate easy-to-type temporary password
    const tempPassword = 'Student' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    logger.info(`📝 Creating ${accountType} account: ${childEmail} for ${req.user.email}`);

    // Create child/student account with proper credentials
    const child = new User({
      email: childEmail,
      password: tempPassword, // Will be hashed by User model pre-save hook
      accountType: accountType,
      parentId,
      profile: { 
        displayName, 
        age: age || null, 
        grade: grade || null 
      },
      subscription: {
        tier: 'free',
        status: 'active'
      },
      entitlements: {
        advancedMode: false,
        legendaryAI: false,
        maxChildren: 0,
        classroomFeatures: false,
        teacherDashboard: false
      },
      gameProgress: {
        gamesPlayed: 0,
        totalScore: 0,
        bestScore: 0
      }
    });

    await child.save();

    logger.info(`✅ ${accountType} account created: ${childEmail}`);

    res.status(201).json({
      success: true,
      message: `${accountType === 'student' ? 'Student' : 'Child'} account created for ${displayName}!`,
      child: {
        _id: child._id,
        email: child.email,
        accountType: child.accountType,
        profile: child.profile,
        createdAt: child.createdAt,
        parentId: child.parentId
      },
      tempPassword // CRITICAL: Send password to frontend so teacher can share it
    });

  } catch (error) {
    logger.error('❌ Create child error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating child account',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/my-children
 * @desc    Get all child accounts for logged in parent/teacher
 * @access  Private
 */
router.get('/my-children', protect, async (req, res) => {
  try {
    // Allow both parents and teachers
    if (req.user.accountType !== 'parent' && req.user.accountType !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only parents and teachers can access child accounts'
      });
    }

    const children = await User.find({ 
      parentId: req.user._id 
    }).select('email profile gameProgress createdAt accountType');

    logger.info(`📋 Fetching children for ${req.user.email}: ${children.length} found`);

    res.json({
      success: true,
      count: children.length,
      maxChildren: req.user.entitlements.maxChildren,
      children: children.map(child => ({
        _id: child._id,
        email: child.email,
        accountType: child.accountType,
        profile: {
          displayName: child.profile.displayName,
          age: child.profile.age,
          grade: child.profile.grade
        },
        gameProgress: {
          gamesPlayed: child.gameProgress?.gamesPlayed || 0,
          bestScore: child.gameProgress?.bestScore || 0,
          totalScore: child.gameProgress?.totalScore || 0
        },
        createdAt: child.createdAt
      }))
    });

  } catch (error) {
    logger.error('❌ Get children error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching children' 
    });
  }
});

/**
 * @route   DELETE /api/auth/child/:childId
 * @desc    Delete a child/student account
 * @access  Private (Parent/Teacher only)
 */
router.delete('/child/:childId', protect, async (req, res) => {
  try {
    const { childId } = req.params;

    // Allow both parents and teachers
    if (req.user.accountType !== 'parent' && req.user.accountType !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only parents and teachers can delete child accounts'
      });
    }

    // Find child and verify it belongs to this parent/teacher
    const child = await User.findOne({
      _id: childId,
      parentId: req.user._id
    });

    if (!child) {
      return res.status(404).json({ 
        success: false, 
        message: 'Child/student account not found or you do not have permission' 
      });
    }

    const childName = child.profile.displayName;

    await User.findByIdAndDelete(childId);

    logger.info(`🗑️ Child account deleted by ${req.user.accountType} ${req.user._id}: ${childName} (${childId})`);

    res.json({
      success: true,
      message: `${childName}'s account deleted successfully`
    });

  } catch (error) {
    logger.error('❌ Delete child error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting account',
      error: error.message
    });
  }
});

module.exports = router;
