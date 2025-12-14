// frontend/src/pages/AccountPage.tsx
// User account dashboard with child account management and Stripe billing portal

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Loader,
  Plus,
  X,
  Copy,
  Trash2,
  AlertCircle,
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { useAuthStore } from '../store/AuthStore';
import { formatSubscriptionDate } from '../utils/authHelpers';
import authService from '../services/authService';
import toast from 'react-hot-toast';

interface ChildAccount {
  _id: string;
  email: string;
  profile: {
    displayName: string;
    age: number;
    grade: string;
  };
  accountType: string;
  createdAt: string;
}

interface NewChildCredentials {
  email: string;
  password: string;
  displayName: string;
}

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [billingLoading, setBillingLoading] = useState(false);
  
  // Child account management state
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newChildCredentials, setNewChildCredentials] = useState<NewChildCredentials | null>(null);
  
  // Form state
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childGrade, setChildGrade] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  // Load child accounts on mount
  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setChildrenLoading(true);
      const response = await authService.getMyChildren();
      setChildren(response.children || []);
    } catch (error: any) {
      console.error('Error loading children:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load student accounts');
      }
    } finally {
      setChildrenLoading(false);
    }
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!childName.trim()) {
      toast.error('Please enter student name');
      return;
    }
    if (!childAge || parseInt(childAge) < 1 || parseInt(childAge) > 100) {
      toast.error('Please enter a valid age');
      return;
    }
    if (!childGrade.trim()) {
      toast.error('Please enter grade level');
      return;
    }

    // Check if at limit
    if (children.length >= user.entitlements.maxChildren) {
      toast.error(`You can only create ${user.entitlements.maxChildren} student accounts. Please upgrade to add more.`);
      return;
    }

    try {
      setCreateLoading(true);
      const response = await authService.createChild({
        displayName: childName.trim(),
        age: parseInt(childAge),
        grade: childGrade.trim()
      });

      // Store credentials to show to user
      setNewChildCredentials({
        email: response.child.email,
        password: (response as any).tempPassword || 'See response',
        displayName: response.child.profile.displayName
      });

      // Reload children list
      await loadChildren();
      
      // Reset form
      setChildName('');
      setChildAge('');
      setChildGrade('');
      
      toast.success('Student account created successfully!');
    } catch (error: any) {
      console.error('Create child error:', error);
      toast.error(error.response?.data?.message || 'Failed to create student account');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    if (!confirm(`Are you sure you want to delete ${childName}'s account? This cannot be undone.`)) {
      return;
    }

    try {
      await authService.deleteChild(childId);
      toast.success('Student account deleted');
      await loadChildren();
    } catch (error: any) {
      console.error('Delete child error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete student account');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const closeCredentialsModal = () => {
    setNewChildCredentials(null);
    setShowCreateModal(false);
  };

  const accountTypeLabel = user.accountType === 'teacher' ? 'Student' : 'Child';
  const accountTypeLabelPlural = user.accountType === 'teacher' ? 'Students' : 'Children';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
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

        <div className="grid lg:grid-cols-3 gap-8">
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
                <span className="text-sm">{user.email}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <Users size={20} />
                <span>
                  {children.length}/{user.entitlements.maxChildren} {accountTypeLabelPlural}
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
                    <p className="text-white flex items-center gap-2 text-sm">
                      <Calendar size={16} />
                      {formatSubscriptionDate(user.subscription.currentPeriodEnd)}
                    </p>
                  </div>

                  {user.subscription.cancelAtPeriodEnd && (
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                      <p className="text-yellow-200 text-sm">
                        Cancels on {formatSubscriptionDate(user.subscription.currentPeriodEnd)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-3">
              {user.subscription.tier === 'free' ? (
                <button
                  onClick={() => navigate('/subscription')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all"
                >
                  <Zap size={18} />
                  Upgrade
                </button>
              ) : (
                <button
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
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

          {/* Game Progress */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
          >
            <h3 className="text-xl font-bold text-white mb-4">Game Progress</h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {user.gameProgress?.gamesPlayed || 0}
                </div>
                <div className="text-gray-400 text-sm">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {user.gameProgress?.totalScore || 0}
                </div>
                <div className="text-gray-400 text-sm">Total Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {user.gameProgress?.bestScore || 0}
                </div>
                <div className="text-gray-400 text-sm">Best Score</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Child/Student Accounts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <UserPlus size={24} />
                {accountTypeLabel} Accounts
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {children.length} of {user.entitlements.maxChildren} {accountTypeLabelPlural.toLowerCase()} created
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={children.length >= user.entitlements.maxChildren}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              Add {accountTypeLabel}
            </button>
          </div>

          {/* Children List */}
          {childrenLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-blue-400" size={32} />
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-500 mb-4" size={48} />
              <p className="text-gray-400 mb-4">No {accountTypeLabelPlural.toLowerCase()} created yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                <Plus size={18} />
                Create Your First {accountTypeLabel}
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => (
                <div
                  key={child._id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <User className="text-white" size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{child.profile.displayName}</h4>
                        <p className="text-gray-400 text-sm">Grade {child.profile.grade}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteChild(child._id, child.profile.displayName)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-400">
                      <span className="font-medium">Email:</span> {child.email}
                    </p>
                    <p className="text-gray-400">
                      <span className="font-medium">Age:</span> {child.profile.age}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upgrade prompt if at limit */}
          {children.length >= user.entitlements.maxChildren && user.subscription.tier !== 'classroom' && (
            <div className="mt-6 bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-purple-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-purple-200 font-medium mb-2">
                  You've reached your {accountTypeLabel.toLowerCase()} account limit
                </p>
                <button
                  onClick={() => navigate('/subscription')}
                  className="text-sm px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Upgrade to Add More
                </button>
              </div>
            </div>
          )}
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

      {/* Create Child Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !createLoading && !newChildCredentials && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg p-6 max-w-md w-full border border-white/20"
            >
              {!newChildCredentials ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Create {accountTypeLabel} Account</h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      disabled={createLoading}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateChild} className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">{accountTypeLabel} Name</label>
                      <input
                        type="text"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="Enter full name"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                        disabled={createLoading}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Age</label>
                      <input
                        type="number"
                        value={childAge}
                        onChange={(e) => setChildAge(e.target.value)}
                        placeholder="Enter age"
                        min="1"
                        max="100"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                        disabled={createLoading}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Grade</label>
                      <input
                        type="text"
                        value={childGrade}
                        onChange={(e) => setChildGrade(e.target.value)}
                        placeholder="e.g., 6th, 7th, 8th"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                        disabled={createLoading}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={createLoading}
                      className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {createLoading ? (
                        <>
                          <Loader className="animate-spin" size={18} />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Create Account
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-white" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Account Created!</h3>
                    <p className="text-gray-300">Save these credentials - they won't be shown again</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">Student Name</p>
                      <p className="text-white font-semibold">{newChildCredentials.displayName}</p>
                    </div>

                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-gray-400 text-sm">Email</p>
                        <button
                          onClick={() => copyToClipboard(newChildCredentials.email, 'Email')}
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                        >
                          <Copy size={14} />
                          Copy
                        </button>
                      </div>
                      <p className="text-white font-mono text-sm break-all">{newChildCredentials.email}</p>
                    </div>

                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-gray-400 text-sm">Temporary Password</p>
                        <button
                          onClick={() => copyToClipboard(newChildCredentials.password, 'Password')}
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                        >
                          <Copy size={14} />
                          Copy
                        </button>
                      </div>
                      <p className="text-white font-mono text-sm">{newChildCredentials.password}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
                    <p className="text-yellow-200 text-sm">
                      <strong>Important:</strong> Save these credentials now. The student should change their password after first login.
                    </p>
                  </div>

                  <button
                    onClick={closeCredentialsModal}
                    className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountPage;
