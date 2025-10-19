// backend/src/routes/stripeRoutes.js
// Complete Stripe integration with authentication

const express = require('express');
const router = express.Router();

// Import auth middleware
const { auth } = require('../middleware/auth');

// Import User model
const User = require('../models/User');

// Initialize Stripe only if key exists
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized with secret key');
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY not found in .env - Stripe features disabled');
}

// Test route (no auth required)
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Stripe routes working!',
    stripeConfigured: !!stripe,
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/stripe/create-checkout-session
 * @desc    Create Stripe Checkout Session
 * @access  Private (requires auth)
 */
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to .env'
      });
    }

    const { priceId, tier } = req.body;
    const userId = req.user.id;

    console.log('🎫 Creating checkout session for user:', userId);
    console.log('💳 Price ID:', priceId, 'Tier:', tier);

    // Validate input
    if (!priceId || !tier) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: priceId and tier'
      });
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      console.log('👤 Creating new Stripe customer for:', user.email);
      
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.displayName,
        metadata: {
          userId: user._id.toString(),
          accountType: user.accountType
        }
      });

      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
      
      console.log('✅ Stripe customer created:', customerId);
    } else {
      console.log('✅ Using existing Stripe customer:', customerId);
    }

    // Get frontend URL from environment
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${frontendUrl}/account?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${frontendUrl}/subscription?cancelled=true`,
      metadata: {
        userId: user._id.toString(),
        tier: tier
      },
      subscription_data: {
        metadata: {
          userId: user._id.toString(),
          tier: tier
        }
      }
    });

    console.log('✅ Checkout session created:', session.id);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('❌ Stripe checkout error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/stripe/create-portal-session
 * @desc    Create Stripe Customer Portal Session
 * @access  Private (requires auth)
 */
router.post('/create-portal-session', auth, async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to .env'
      });
    }

    const userId = req.user.id;

    console.log('🏦 Creating billing portal session for user:', userId);

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has Stripe customer ID
    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No subscription found. Please subscribe first.'
      });
    }

    // Get frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${frontendUrl}/account`
    });

    console.log('✅ Billing portal session created');

    res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('❌ Billing portal error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create portal session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/stripe/webhook
 * @desc    Stripe Webhook Handler
 * @access  Public (verified with webhook signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    return res.status(503).send('Stripe not configured');
  }

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    console.log('📨 Webhook received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        console.log('✅ Payment succeeded for subscription');
        break;

      case 'invoice.payment_failed':
        console.log('❌ Payment failed for subscription');
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// ===== WEBHOOK HELPER FUNCTIONS =====

async function handleCheckoutCompleted(session) {
  try {
    const userId = session.metadata.userId;
    const tier = session.metadata.tier;

    console.log('✅ Checkout completed for user:', userId, 'Tier:', tier);

    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      return;
    }

    // Update subscription
    user.subscription = {
      status: 'active',
      tier: tier,
      stripeSubscriptionId: session.subscription,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    // Update entitlements based on tier
    if (tier === 'premium') {
      user.entitlements.advancedMode = true;
      user.entitlements.legendaryAI = true;
      user.entitlements.maxChildren = 5;
    } else if (tier === 'classroom') {
      user.entitlements.advancedMode = true;
      user.entitlements.legendaryAI = true;
      user.entitlements.maxChildren = 30;
      user.entitlements.classroomFeatures = true;
      user.entitlements.teacherDashboard = true;
    }

    await user.save();
    console.log('✅ Subscription activated for user:', userId);

  } catch (error) {
    console.error('❌ Error handling checkout completed:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('🔄 Subscription updated:', subscription.id);

    const user = await User.findOne({ 
      'subscription.stripeSubscriptionId': subscription.id 
    });

    if (!user) {
      console.error('❌ User not found for subscription:', subscription.id);
      return;
    }

    user.subscription.status = subscription.status;
    user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    user.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end || false;

    await user.save();
    console.log('✅ Subscription updated for user:', user._id);

  } catch (error) {
    console.error('❌ Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('❌ Subscription cancelled:', subscription.id);

    const user = await User.findOne({ 
      'subscription.stripeSubscriptionId': subscription.id 
    });

    if (!user) {
      console.error('❌ User not found for subscription:', subscription.id);
      return;
    }

    // Downgrade to free tier
    user.subscription = {
      status: 'cancelled',
      tier: 'free'
    };

    user.entitlements = {
      advancedMode: false,
      legendaryAI: false,
      maxChildren: 1,
      classroomFeatures: false,
      teacherDashboard: false
    };

    await user.save();
    console.log('✅ User downgraded to free tier:', user._id);

  } catch (error) {
    console.error('❌ Error handling subscription deleted:', error);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    console.log('❌ Payment failed for invoice:', invoice.id);

    const user = await User.findOne({ 
      stripeCustomerId: invoice.customer 
    });

    if (!user) {
      console.error('❌ User not found for customer:', invoice.customer);
      return;
    }

    user.subscription.status = 'past_due';
    await user.save();

    console.log('⚠️ User subscription marked as past_due:', user._id);

  } catch (error) {
    console.error('❌ Error handling payment failed:', error);
  }
}

module.exports = router;