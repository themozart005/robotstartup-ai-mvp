// frontend/src/pages/SubscriptionPage.tsx
// Stripe subscription pricing page

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Zap, Users, Trophy, Star, Crown, ArrowLeft, Loader } from 'lucide-react';
import { useAuthStore } from '../store/AuthStore';
import toast from 'react-hot-toast';

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Pricing info (will be fetched from backend later)
  const pricing = {
    individual: {
      monthly: { amount: 9.99, priceId: 'price_1SHcF8CiCOYBXbmhqJWAiICa' },
      yearly: { amount: 99.99, priceId: 'price_1SHcHYCiCOYBXbmhcGpRBB2J', savings: '17%' }
    },
    classroom: {
      monthly: { amount: 29.99, priceId: 'price_1SHcMTCiCOYBXbmhPeW2knR0' },
      yearly: { amount: 299.99, priceId: 'price_1SHcOqCiCOYBXbmhtnSMu0Ux', savings: '17%' }
    }
  };

  const handleSubscribe = async (priceId: string, planName: string) => {
    setLoading(true);
    setSelectedPlan(planName);
    
    try {
      
      const tier = planName.includes('Classroom') ? 'classroom' : 'premium';
      // Import stripe service
	  const { stripeService } = await import('../services/stripeService');
      // Redirect to Stripe Checkout
      await stripeService.redirectToCheckout(priceId, tier);
	  
    } catch (error: any) {
	  console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Failed to start checkout');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300">
            Unlock advanced features and give your kids the best learning experience
          </p>
          
          {user && user.subscription.tier !== 'free' && (
            <div className="mt-4 inline-block px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-300">
                Current Plan: <strong className="text-green-200">{user.subscription.tier.toUpperCase()}</strong>
              </p>
            </div>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="text-4xl font-bold text-white">
                $0<span className="text-lg text-gray-400">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <FeatureItem icon={<Check />} text="Core game modes" />
              <FeatureItem icon={<Users />} text="1 child account" />
              <FeatureItem icon={<Zap />} text="Basic AI tutoring" />
              <FeatureItem icon={<Trophy />} text="Progress tracking" />
            </ul>

            <button
              disabled
              className="w-full py-3 px-6 rounded-lg font-semibold bg-gray-500 text-white cursor-not-allowed"
            >
              Current Plan
            </button>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 border-2 border-blue-400 relative overflow-hidden transform scale-105"
          >
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
              ⭐ POPULAR
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <div className="text-4xl font-bold text-white">
                ${pricing.individual.monthly.amount}
                <span className="text-lg text-white/80">/month</span>
              </div>
              <p className="text-sm text-white/80 mt-2">
                or ${pricing.individual.yearly.amount}/year (save {pricing.individual.yearly.savings})
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <FeatureItem icon={<Star />} text="Advanced Mode" bright />
              <FeatureItem icon={<Users />} text="Up to 5 child accounts" bright />
              <FeatureItem icon={<Zap />} text="Priority AI tutoring" bright />
              <FeatureItem icon={<Trophy />} text="Detailed analytics" bright />
              <FeatureItem icon={<Star />} text="Early feature access" bright />
            </ul>

            <button
              onClick={() => handleSubscribe(pricing.individual.monthly.priceId, 'Premium Monthly')}
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg font-semibold bg-white text-blue-600 hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && selectedPlan === 'Premium Monthly' ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                'Upgrade to Premium'
              )}
            </button>
          </motion.div>

          {/* Classroom Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Crown className="text-yellow-400" size={24} />
                Classroom
              </h3>
              <div className="text-4xl font-bold text-white">
                ${pricing.classroom.monthly.amount}
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                or ${pricing.classroom.yearly.amount}/year (save {pricing.classroom.yearly.savings})
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <FeatureItem icon={<Star />} text="Everything in Premium" />
              <FeatureItem icon={<Users />} text="Up to 30 student accounts" />
              <FeatureItem icon={<Trophy />} text="Teacher dashboard" />
              <FeatureItem icon={<Zap />} text="Class analytics" />
              <FeatureItem icon={<Star />} text="Bulk student import" />
            </ul>

            <button
              onClick={() => handleSubscribe(pricing.classroom.monthly.priceId, 'Classroom Monthly')}
              disabled={loading}
              className="w-full py-3 px-6 rounded-lg font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && selectedPlan === 'Classroom Monthly' ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                'Upgrade to Classroom'
              )}
            </button>
          </motion.div>
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <FAQItem
              question="Can I cancel anytime?"
              answer="Yes! Cancel anytime and your subscription will remain active until the end of your billing period."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards through our secure Stripe payment processor."
            />
            <FAQItem
              question="Is this COPPA compliant?"
              answer="Yes! We take child privacy seriously. Only parents can create accounts and manage subscriptions."
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ReactNode; text: string; bright?: boolean }> = ({ 
  icon, 
  text, 
  bright 
}) => (
  <li className="flex items-center gap-3">
    <div className={`flex-shrink-0 w-6 h-6 ${bright ? 'text-white' : 'text-green-400'}`}>
      {icon}
    </div>
    <span className={bright ? 'text-white font-medium' : 'text-gray-300'}>
      {text}
    </span>
  </li>
);

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <details className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 cursor-pointer">
    <summary className="text-white font-semibold">
      {question}
    </summary>
    <p className="text-gray-300 mt-4">{answer}</p>
  </details>
);

export default SubscriptionPage;