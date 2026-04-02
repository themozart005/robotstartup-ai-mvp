// backend/src/routes/webhookRoutes.js — FULL REPLACEMENT
// LevelUp Ventures Platform — Stripe Webhook Handler
//
// IMPORTANT: This route must use express.raw() NOT express.json()
// Register it in server.js BEFORE the global express.json() middleware:
//
//   app.use('/api/webhook', require('./routes/webhookRoutes'));
//   app.use(express.json()); // ← after webhook
//

const express      = require('express');
const router       = express.Router();
const Stripe       = require('stripe');
const User         = require('../models/User');
const Organization = require('../models/Organization');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// ─── Webhook endpoint — raw body required for signature verification ──────────
router.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('⚠️  Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`📨 Stripe event received: ${event.type}`);

    try {
      switch (event.type) {

        // ─── Payment completed — activate license ────────────────────────────
        case 'checkout.session.completed': {
          await handleCheckoutComplete(event.data.object);
          break;
        }

        // ─── Subscription renewed successfully ───────────────────────────────
        case 'invoice.payment_succeeded': {
          await handlePaymentSucceeded(event.data.object);
          break;
        }

        // ─── Payment failed — notify but don't immediately kill access ───────
        case 'invoice.payment_failed': {
          await handlePaymentFailed(event.data.object);
          break;
        }

        // ─── User cancelled via Stripe portal ────────────────────────────────
        case 'customer.subscription.deleted': {
          await handleSubscriptionCancelled(event.data.object);
          break;
        }

        // ─── Subscription updated (plan change, renewal) ─────────────────────
        case 'customer.subscription.updated': {
          await handleSubscriptionUpdated(event.data.object);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Webhook handler error:', err);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: checkout.session.completed
// Creates or upgrades the Organization record and activates the license
// ─────────────────────────────────────────────────────────────────────────────
async function handleCheckoutComplete(session) {
  const { userId, tier, orgName, orgId } = session.metadata;

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found for checkout:', userId);
    return;
  }

  const tierDefaults  = Organization.tierDefaults(tier);
  const licenseExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

  // If upgrading from a trial (orgId exists), update that org record
  if (orgId) {
    const org = await Organization.findByIdAndUpdate(
      orgId,
      {
        type:                 tier,
        licenseStatus:        'active',
        licenseExpiry,
        stripeCustomerId:     session.customer,
        stripeSubscriptionId: session.subscription,
        allowedTeachers:      tierDefaults.allowedTeachers,
        allowedStudents:      tierDefaults.allowedStudents,
        modules:              tierDefaults.modules,
        features:             tierDefaults.features,
      },
      { new: true }
    );
    console.log(`✅ Upgraded trial org ${org._id} to ${tier}`);
  } else {
    // Fresh purchase — create new org
    const org = await Organization.create({
      name:                 orgName,
      type:                 tier,
      licenseStatus:        'active',
      licenseExpiry,
      stripeCustomerId:     session.customer,
      stripeSubscriptionId: session.subscription,
      adminUserId:          user._id,
      allowedTeachers:      tierDefaults.allowedTeachers,
      allowedStudents:      tierDefaults.allowedStudents,
      modules:              tierDefaults.modules,
      features:             tierDefaults.features,
    });

    user.orgId = org._id;
    console.log(`✅ Created new org ${org._id} for ${tier}`);
  }

  // Update user subscription
  user.role = tier === 'district' ? 'district_admin' : tier === 'school' ? 'school_admin' : 'teacher';
  user.subscription = {
    tier,
    status:               'active',
    stripeCustomerId:     session.customer,
    stripeSubscriptionId: session.subscription,
    licenseExpiry,
  };

  await user.save();
  console.log(`✅ License activated: ${tier} for user ${userId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: invoice.payment_succeeded
// Renews the license for another year on successful recurring payment
// ─────────────────────────────────────────────────────────────────────────────
async function handlePaymentSucceeded(invoice) {
  if (invoice.billing_reason !== 'subscription_cycle') return; // skip first payment (handled above)

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId       = subscription.metadata?.userId;

  if (!userId) return;

  const licenseExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const user = await User.findById(userId);
  if (!user) return;

  // Renew org
  if (user.orgId) {
    await Organization.findByIdAndUpdate(user.orgId, {
      licenseStatus: 'active',
      licenseExpiry,
    });
  }

  // Renew user subscription
  user.subscription.status        = 'active';
  user.subscription.licenseExpiry = licenseExpiry;
  await user.save();

  console.log(`🔄 License renewed for user ${userId} until ${licenseExpiry}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: invoice.payment_failed
// Logs the failure; Stripe will retry — don't kill access immediately
// ─────────────────────────────────────────────────────────────────────────────
async function handlePaymentFailed(invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const userId       = subscription.metadata?.userId;

  if (!userId) return;

  console.warn(`⚠️ Payment failed for user ${userId} — Stripe will retry`);
  // Optional: send an email via your notification service here
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: customer.subscription.deleted
// User cancelled — expire the license at end of current period
// ─────────────────────────────────────────────────────────────────────────────
async function handleSubscriptionCancelled(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const user = await User.findById(userId);
  if (!user) return;

  if (user.orgId) {
    await Organization.findByIdAndUpdate(user.orgId, {
      licenseStatus: 'cancelled',
    });
  }

  user.subscription.status = 'cancelled';
  await user.save();

  console.log(`❌ Subscription cancelled for user ${userId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER: customer.subscription.updated
// Handles mid-cycle tier changes (upgrade/downgrade)
// ─────────────────────────────────────────────────────────────────────────────
async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const user = await User.findById(userId);
  if (!user || !user.orgId) return;

  // Determine new tier from price ID
  const priceId = subscription.items.data[0]?.price?.id;
  let newTier   = null;

  if (priceId === process.env.STRIPE_PRICE_CLASSROOM) newTier = 'classroom';
  if (priceId === process.env.STRIPE_PRICE_SCHOOL)    newTier = 'school';
  if (priceId === process.env.STRIPE_PRICE_DISTRICT)  newTier = 'district';

  if (!newTier) return;

  const tierDefaults = Organization.tierDefaults(newTier);

  await Organization.findByIdAndUpdate(user.orgId, {
    type:            newTier,
    allowedTeachers: tierDefaults.allowedTeachers,
    allowedStudents: tierDefaults.allowedStudents,
    modules:         tierDefaults.modules,
    features:        tierDefaults.features,
  });

  user.subscription.tier = newTier;
  user.role = newTier === 'district' ? 'district_admin' : newTier === 'school' ? 'school_admin' : 'teacher';
  await user.save();

  console.log(`🔀 Subscription updated to ${newTier} for user ${userId}`);
}

module.exports = router;
