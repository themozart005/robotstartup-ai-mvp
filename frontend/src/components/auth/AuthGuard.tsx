// frontend/src/components/auth/AuthGuard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Zap, Crown } from 'lucide-react';
import { useAuthStore } from '../../store/AuthStore';
import { useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
  feature: 'advancedMode' | 'legendaryAI' | 'classroomFeatures' | 'teacherDashboard';
  fallback?: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  feature,
  fallback 
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-300">
          <Lock size={20} />
          <span>Please log in to access this feature</span>
        </div>
      </div>
    );
  }

  const hasAccess = user.entitlements[feature] === true;

  if (hasAccess) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  if (fallback) {
    return <React.Fragment>{fallback}</React.Fragment>;
  }

  const getFeatureName = () => {
    switch (feature) {
      case 'advancedMode': return 'Advanced Mode';
      case 'legendaryAI': return 'Legendary AI Personalities';
      case 'classroomFeatures': return 'Classroom Features';
      case 'teacherDashboard': return 'Teacher Dashboard';
      default: return 'This Feature';
    }
  };

  const getRequiredTier = () => {
    if (feature === 'classroomFeatures' || feature === 'teacherDashboard') {
      return 'Classroom';
    }
    return 'Premium';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-center"
    >
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
          <Crown className="text-white" size={32} />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">
        Unlock {getFeatureName()}
      </h3>
      
      <p className="text-purple-100 mb-6">
        Upgrade to {getRequiredTier()} to access this powerful feature and supercharge your learning!
      </p>
      
      <button
        onClick={() => navigate('/subscription')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
      >
        <Zap size={20} />
        Upgrade Now
      </button>
    </motion.div>
  );
};

export default AuthGuard;