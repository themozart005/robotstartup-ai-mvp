// backend/src/routes/paymentRoutes.js
// API endpoints for Stripe payments

const express = require('express');
const router = express.Router();
const { protect, parentOnly } = require('../middleware/auth');
const stripeService = require('../services/StripeService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/payments/pricing
 * @desc    Get pricing information
 * @access  Public
 */
router.get('/pricing', (req, res) => {
  try {
    const pricing = stripeService.getPricingInfo();
    res.json({
      success: true,
      pricing,
      features: {
        free: [
          'Core game modes',
          '1 child account',
          'Basic AI tutoring',
          'Progress tracking'
        ],
        premium: [
          'Advanced Mode with complex mechanics',
          'Up to 5 child accounts',
          'Priority AI tutoring',
          'Detailed analytics',
          'Early access to new features'
        ],
		classroom: [ // NEW
          '✨ Everything in Premium',
          '👥 Up to 20 student accounts',
          '📊 Teacher dashboard with class analytics',
          '🎓 Student progress tracking',
          '📝 Assignment & assessment tools',
          '🏆 Class leaderboards',
          '🎮 Legendary AI personalities',
          '💼 Perfect for teachers & homeschool groups'
        ]
      }
    });
  } catch (error) {
    logger.error('Error getting pricing:', error);
    res.status(500).json({ success: false, message: 'Failed to get pricing' });
  }
});

/**
 * @route   POST /api/payments/create-checkout
 * @desc    Create Stripe checkout session
 * @access  Private (Parent only)
 */
router.post('/create-checkout', protect, parentOnly, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ success: false, message: 'Price ID required' });
    }

    // Check if already subscribed
    if (req.user.subscription.status === 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active subscription' 
      });
    }

    const successUrl = `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL}/subscription/cancelled`;

    const session = await stripeService.createCheckoutSession(
      req.user._id,
      priceId,
      successUrl,
      cancelUrl
    );

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    logger.error('Error creating checkout:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create checkout session' 
    });
  }
});

/**
 * @route   POST /api/payments/create-portal
 * @desc    Create customer portal session
 * @access  Private
 */
router.post('/create-portal', protect, async (req, res) => {
  try {
    const returnUrl = `${process.env.FRONTEND_URL}/account`;

    const session = await stripeService.createPortalSession(
      req.user._id,
      returnUrl
    );

    res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    logger.error('Error creating portal session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create portal session' 
    });
  }
});

/**
 * @route   GET /api/payments/subscription-status
 * @desc    Get current subscription status
 * @access  Private
 */
router.get('/subscription-status', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      subscription: {
        status: req.user.subscription.status,
        tier: req.user.subscription.tier,
        currentPeriodEnd: req.user.subscription.currentPeriodEnd,
        cancelAtPeriodEnd: req.user.subscription.cancelAtPeriodEnd
      },
      entitlements: req.user.entitlements
    });

  } catch (error) {
    logger.error('Error getting subscription status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get subscription status' 
    });
  }
});

module.exports = router;