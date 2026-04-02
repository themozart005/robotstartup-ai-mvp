// backend/src/routes/stripeRoutes.js — FULL REPLACEMENT
// LevelUp Ventures Platform — Tiered License Stripe Routes
//
// Replaces the old monthly/yearly individual subscription routes with
// three institutional license tiers: classroom, school, district.

const express   = require('express');
const router    = express.Router();
const Stripe    = require('stripe');
const User      = require('../models/User');
const Organization = require('../models/Organization');
const { protect: auth } = require('../middleware/auth'); // your existing JWT middleware

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// ─── Tier → Stripe Price ID mapping ──────────────────────────────────────────
// Set these in your Railway environment variables
const LICENSE_PRICES = {
  classroom: process.env.STRIPE_PRICE_CLASSROOM, // $499/yr
  school:    process.env.STRIPE_PRICE_SCHOOL,    // $1,999/yr
  district:  process.env.STRIPE_PRICE_DISTRICT,  // $6,999/yr
};

const LICENSE_NAMES = {
  classroom: 'LevelUp Classroom License — $499/yr',
  school:    'LevelUp School License — $1,999/yr',
  district:  'LevelUp District License — $6,999/yr',
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/pricing
// Public — returns tier info for the pricing page
// ─────────────────────────────────────────────────────────────────────────────
router.get('/pricing', async (req, res) => {
  try {
    res.json({
      success: true,
      tiers: [
        {
          id:          'classroom',
          name:        'Classroom',
          price:       499,
          interval:    'year',
          description: 'Perfect for a single teacher',
          teachers:    1,
          students:    35,
          modules:     ['RoboStartup AI'],
          features: [
            '1 teacher account',
            'Up to 35 students',
            'RoboStartup AI module',
            '14-day free trial',
            'Email support',
          ],
          highlighted: false,
        },
        {
          id:          'school',
          name:        'School',
          price:       1999,
          interval:    'year',
          description: 'For CTE departments and schools',
          teachers:    10,
          students:    300,
          modules:     ['RoboStartup AI', 'Healthcare', 'Clean Energy', 'FinTech'],
          features: [
            'Up to 10 teacher accounts',
            'Up to 300 students',
            'All current modules',
            'Data reports & analytics',
            '14-day free trial',
            'Priority email support',
          ],
          highlighted: true, // most popular
        },
        {
          id:          'district',
          name:        'District',
          price:       6999,
          interval:    'year',
          description: 'District-wide deployment',
          teachers:    null,  // unlimited
          students:    null,  // unlimited
          modules:     ['RoboStartup AI', 'Healthcare', 'Clean Energy', 'FinTech'],
          features: [
            'Unlimited teachers & students',
            'All current + future modules',
            'Admin dashboard',
            'Behavioral data reports (IES-ready)',
            'Professional development support',
            'Custom branding',
            'Dedicated onboarding',
            'Phone + email support',
          ],
          highlighted: false,
        },
      ],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/start-trial
// Authenticated — starts a 14-day free trial for a teacher, no card required
// Body: { tier: 'classroom' | 'school' | 'district', orgName: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/start-trial', auth, async (req, res) => {
  try {
    const { tier, orgName } = req.body;

    if (!tier || !orgName) {
      return res.status(400).json({ success: false, message: 'tier and orgName are required' });
    }

    if (!LICENSE_PRICES[tier]) {
      return res.status(400).json({ success: false, message: 'Invalid license tier' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Don't allow a second trial
    if (user.subscription && user.subscription.status !== 'inactive') {
      return res.status(400).json({ success: false, message: 'Trial or subscription already exists' });
    }

    const trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    const tierDefaults = Organization.tierDefaults(tier);

    // Create org record in trial state
    const org = await Organization.create({
      name:            orgName,
      type:            tier,
      licenseStatus:   'trial',
      trialStarted:    new Date(),
      trialExpiry,
      adminUserId:     user._id,
      allowedTeachers: tierDefaults.allowedTeachers,
      allowedStudents: tierDefaults.allowedStudents,
      modules:         tierDefaults.modules,
      features:        tierDefaults.features,
    });

    // Update user
    user.orgId = org._id;
    user.role  = tier === 'district' ? 'district_admin' : tier === 'school' ? 'school_admin' : 'teacher';
    user.subscription = {
      tier,
      status:      'trialing',
      trialExpiry,
    };
    await user.save();

    res.json({
      success: true,
      message: `14-day trial started for ${LICENSE_NAMES[tier]}`,
      orgId:   org._id,
      expiry:  trialExpiry,
    });
  } catch (err) {
    console.error('start-trial error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create-checkout
// Authenticated — creates a Stripe Checkout session for a license purchase
// Body: { tier: 'classroom' | 'school' | 'district', orgName: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-checkout', auth, async (req, res) => {
  try {
    const { tier, orgName } = req.body;

    if (!tier || !orgName) {
      return res.status(400).json({ success: false, message: 'tier and orgName are required' });
    }

    if (!LICENSE_PRICES[tier]) {
      return res.status(400).json({ success: false, message: 'Invalid license tier' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price:    LICENSE_PRICES[tier],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      metadata: {
        userId:  user._id.toString(),
        tier,
        orgName,
        // If they already have a trial org, pass orgId so webhook can upgrade it
        orgId: user.orgId ? user.orgId.toString() : '',
      },
      subscription_data: {
        metadata: { userId: user._id.toString(), tier, orgName },
      },
      success_url: `${process.env.FRONTEND_URL}/dashboard?activated=true&tier=${tier}`,
      cancel_url:  `${process.env.FRONTEND_URL}/pricing?cancelled=true`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('create-checkout error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/customer-portal
// Authenticated — opens Stripe Customer Portal for billing management
// ─────────────────────────────────────────────────────────────────────────────
router.post('/customer-portal', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user?.subscription?.stripeCustomerId) {
      return res.status(400).json({ success: false, message: 'No active subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   user.subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('customer-portal error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments/license-status
// Authenticated — returns the current user's org + license details
// ─────────────────────────────────────────────────────────────────────────────
router.get('/license-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('orgId');

    res.json({
      success: true,
      subscription: user.subscription || { tier: 'free', status: 'inactive' },
      org: user.orgId || null,
      role: user.role || 'teacher',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
