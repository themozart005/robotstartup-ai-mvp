// frontend/src/pages/AccountPage.tsx
// User account dashboard with Stripe billing portal

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Crown, 
  Calendar, 
  ArrowLeft, 
  Settings,
  CreditCard,
  Users,
  LogOut,
  Zap,
  Loader
} from 'lucide-react';
import { useAuthStore } from '../store/AuthStore';
import { formatSubscriptionDate } from '../utils/authHelpers';
import toast from 'react-hot-toast';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [billingLoading, setBillingLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Handle billing portal
  const handleManageBilling = async () => {
    setBillingLoading(true);
    
    try {
      const { stripeService } = await import('../services/stripeService');
      await stripeService.redirectToBillingPortal();
    } catch (error: any) {
      console.error('Billing portal error:', error);
      toast.error(error.response?.data?.message || 'Failed to open billing portal');
      setBillingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-2">My Account</h1>
          <p className="text-gray-300">Manage your profile and subscription</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
                <p className="text-gray-400 capitalize">{user.accountType} Account</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail size={20} />
                <span>{user.email}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <Users size={20} />
                <span>
                  {user.entitlements.maxChildren} {user.accountType === 'teacher' ? 'students' : 'children'} allowed
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/20">
              <button
                onClick={() => toast.info('Profile editing coming soon!')}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Settings size={18} />
                Edit Profile
              </button>
            </div>
          </motion.div>

          {/* Subscription Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Crown className="text-yellow-400" size={28} />
              <h3 className="text-xl font-bold text-white">Subscription</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Current Plan</p>
                <p className="text-2xl font-bold text-white capitalize">
                  {user.subscription.tier}
                  {user.subscription.tier !== 'free' && (
                    <span className="ml-2 text-sm font-normal text-green-400">
                      ({user.subscription.status})
                    </span>
                  )}
                </p>
              </div>

              {user.subscription.tier !== 'free' && user.subscription.currentPeriodEnd && (
                <>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Renewal Date</p>
                    <p className="text-white flex items-center gap-2">
                      <Calendar size={16} />
                      {formatSubscriptionDate(user.subscription.currentPeriodEnd)}
                    </p>
                  </div>

                  {user.subscription.cancelAtPeriodEnd && (
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-yellow-200 text-sm">
                        Your subscription will cancel on {formatSubscriptionDate(user.subscription.currentPeriodEnd)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-3">
              {user.subscription.tier === 'free' ? (
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all"
                >
                  <Zap size={18} />
                  Upgrade to Premium
                </button>
              ) : (
                <button
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {billingLoading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      <span>Opening...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      <span>Manage Billing</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Game Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
        >
          <h3 className="text-xl font-bold text-white mb-4">Game Progress</h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">
                {user.gameProgress?.gamesPlayed || 0}
              </div>
              <div className="text-gray-400 text-sm">Games Played</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">
                {user.gameProgress?.totalScore || 0}
              </div>
              <div className="text-gray-400 text-sm">Total Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">
                {user.gameProgress?.bestScore || 0}
              </div>
              <div className="text-gray-400 text-sm">Best Score</div>
            </div>
          </div>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountPage;