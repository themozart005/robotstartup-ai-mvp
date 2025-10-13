// backend/src/services/StripeService.js
// Handles all Stripe operations

const Stripe = require('stripe');
const User = require('../models/User');
const logger = require('../utils/logger');

class StripeService {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_PLACEHOLDER') {
      logger.warn('⚠️ Stripe not configured - payment features disabled');
      this.stripe = null;
      this.enabled = false;
      return;
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    
    this.enabled = true;
    logger.info('✅ Stripe service initialized');
  }

  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(user) {
    if (!this.enabled) throw new Error('Stripe not enabled');

    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.profile.displayName,
        metadata: {
          userId: user._id.toString(),
          accountType: user.accountType
        }
      });

      // Save customer ID to user
      user.subscription.stripeCustomerId = customer.id;
      await user.save();

      logger.info(`💳 Stripe customer created: ${customer.id} for user ${user._id}`);
      return customer;

    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(userId, priceId, successUrl, cancelUrl) {
    if (!this.enabled) throw new Error('Stripe not enabled');

    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Create customer if doesn't exist
      if (!user.subscription.stripeCustomerId) {
        await this.createCustomer(user);
      }

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        customer: user.subscription.stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user._id.toString()
        },
        subscription_data: {
          metadata: {
            userId: user._id.toString()
          }
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required'
      });

      logger.info(`🛒 Checkout session created: ${session.id} for user ${userId}`);
      return session;

    } catch (error) {
      logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Handle successful checkout (webhook event)
   */
  async handleCheckoutComplete(session) {
    try {
      const userId = session.metadata.userId;
      const user = await User.findById(userId);

      if (!user) {
        logger.error('User not found for checkout session:', userId);
        return;
      }

      // Get subscription details
      const subscription = await this.stripe.subscriptions.retrieve(session.subscription);
	  // Get the price ID to determine tier
      const priceId = subscription.items.data[0].price.id;	
	  
      // Update user subscription
      user.subscription.status = 'active';
      user.subscription.stripeSubscriptionId = subscription.id;
      user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
      // Determine tier based on price ID
      if (priceId === process.env.STRIPE_PRICE_CLASSROOM_MONTHLY || 
          priceId === process.env.STRIPE_PRICE_CLASSROOM_YEARLY) {
        // Classroom tier
        user.subscription.tier = 'classroom';
        user.entitlements.advancedMode = true;
        user.entitlements.legendaryAI = true;
        user.entitlements.maxChildren = 30; // 30 students
        user.entitlements.classroomFeatures = true;
        user.entitlements.teacherDashboard = true;
        user.entitlements.bulkStudentImport = true;
      
        // Convert account to teacher if it's a parent
        if (user.accountType === 'parent') {
          user.accountType = 'teacher';
        }
      
        logger.info(`✅ Classroom subscription activated for user ${userId}`);
      
      } else {
        // Premium (individual) tier
        user.subscription.tier = 'premium';
        user.entitlements.advancedMode = true;
        user.entitlements.legendaryAI = false; // V1.4b
        user.entitlements.maxChildren = 5;
      
        logger.info(`✅ Premium subscription activated for user ${userId}`);
      }

      await user.save();

    } catch (error) {
      logger.error('Error handling checkout complete:', error);
      throw error;
    }
  }

  /**
   * Handle subscription updates (webhook events)
   */
  async handleSubscriptionUpdate(subscription) {
    try {
      const userId = subscription.metadata.userId;
      const user = await User.findById(userId);

      if (!user) {
        logger.error('User not found for subscription:', userId);
        return;
      }

      // Update subscription status
      user.subscription.status = subscription.status;
      user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      user.subscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;

      // Handle different statuses
      switch (subscription.status) {
        case 'active':
          user.entitlements.advancedMode = true;
          user.entitlements.maxChildren = 5;
          break;

        case 'past_due':
        case 'unpaid':
          logger.warn(`⚠️ Subscription past due for user ${userId}`);
          break;

        case 'canceled':
        case 'incomplete_expired':
          user.subscription.tier = 'free';
          user.entitlements.advancedMode = false;
          user.entitlements.legendaryAI = false;
          user.entitlements.maxChildren = 1;
          logger.info(`❌ Subscription cancelled for user ${userId}`);
          break;
      }

      await user.save();

    } catch (error) {
      logger.error('Error handling subscription update:', error);
      throw error;
    }
  }

  /**
   * Handle subscription deletion (webhook event)
   */
  async handleSubscriptionDeleted(subscription) {
    try {
      const userId = subscription.metadata.userId;
      const user = await User.findById(userId);

      if (!user) return;

      // Downgrade to free tier
      user.subscription.status = 'cancelled';
      user.subscription.tier = 'free';
      user.subscription.stripeSubscriptionId = null;
      user.subscription.currentPeriodEnd = null;
      
      // Remove premium entitlements
      user.entitlements.advancedMode = false;
      user.entitlements.legendaryAI = false;
      user.entitlements.maxChildren = 1;

      await user.save();

      logger.info(`🔻 User downgraded to free tier: ${userId}`);

    } catch (error) {
      logger.error('Error handling subscription deletion:', error);
      throw error;
    }
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(userId, returnUrl) {
    if (!this.enabled) throw new Error('Stripe not enabled');

    try {
      const user = await User.findById(userId);
      if (!user || !user.subscription.stripeCustomerId) {
        throw new Error('No Stripe customer found');
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: user.subscription.stripeCustomerId,
        return_url: returnUrl
      });

      return session;

    } catch (error) {
      logger.error('Error creating portal session:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.enabled) throw new Error('Stripe not enabled');

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Get pricing info
   */
  getPricingInfo() {
    return {
      individual: {
        monthly: {
          priceId: process.env.STRIPE_PRICE_MONTHLY,
          amount: 9.99,
          currency: 'usd',
          interval: 'month',
          tier: 'premium'
        },
        yearly: {
          priceId: process.env.STRIPE_PRICE_YEARLY,
          amount: 99.99,
          currency: 'usd',
          interval: 'year',
          tier: 'premium',
          savings: '17%'
        }
      },
      classroom: {
        monthly: {
          priceId: process.env.STRIPE_PRICE_CLASSROOM_MONTHLY,
          amount: 29.99,
          currency: 'usd',
          interval: 'month',
          tier: 'classroom'
        },
        yearly: {
          priceId: process.env.STRIPE_PRICE_CLASSROOM_YEARLY,
          amount: 299.99,
          currency: 'usd',
          interval: 'year',
          tier: 'classroom',
          savings: '17%'
        }
      }
    };
  }

  isEnabled() {
    return this.enabled;
  }
}

// Singleton instance
const stripeService = new StripeService();

module.exports = stripeService;