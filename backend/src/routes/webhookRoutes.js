// backend/src/routes/webhookRoutes.js
// Stripe webhook handler

const express = require('express');
const router = express.Router();
const stripeService = require('../services/StripeService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (verified with signature)
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(req.body, signature);

    logger.info(`🔔 Webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await stripeService.handleCheckoutComplete(event.data.object);
        break;

      case 'customer.subscription.updated':
        await stripeService.handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await stripeService.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        logger.info(`💰 Payment succeeded: ${event.data.object.id}`);
        break;

      case 'invoice.payment_failed':
        logger.warn(`⚠️ Payment failed: ${event.data.object.id}`);
        break;

      default:
        logger.info(`Unhandled webhook event: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    logger.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error: ' + error.message });
  }
});

module.exports = router;