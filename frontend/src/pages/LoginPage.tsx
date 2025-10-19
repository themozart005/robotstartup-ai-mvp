// frontend/src/pages/LoginPage.tsx
// Login page matching your HomePage design style

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle, Rocket, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/AuthStore';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get the page user was trying to access
  const from = (location.state as any)?.from?.pathname || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!email.trim()) {
      errors.push('Email is required');
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('Please enter a valid email');
    }

    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20 mb-4"
          >
            <Rocket className="text-blue-400" size={28} />
            <span className="text-white font-semibold text-xl">RoboStartup AI</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
          <p className="text-gray-300">Log in to continue your business journey</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-white font-medium mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-white font-medium mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="text-gray-400 hover:text-white" size={20} />
                  ) : (
                    <Eye className="text-gray-400 hover:text-white" size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/20 border border-red-500/30 rounded-lg p-3"
              >
                {validationErrors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-red-300 text-sm">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Server Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/20 border border-red-500/30 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 text-red-300 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition-all ${
                isLoading
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Log In</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-400">Don't have an account?</span>
            </div>
          </div>

          {/* Register Links */}
          <div className="space-y-3">
            <Link
              to="/register?type=parent"
              className="block w-full text-center py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Sign Up as Parent
            </Link>
            <Link
              to="/register?type=teacher"
              className="block w-full text-center py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Sign Up as Teacher
            </Link>
          </div>
        </div>

        {/* Additional Links */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-blue-300 hover:text-blue-200 text-sm underline"
          >
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;