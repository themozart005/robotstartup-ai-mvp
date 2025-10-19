// frontend/src/pages/RegisterPage.tsx
// Registration page for parents and teachers

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, School, AlertCircle, Rocket, Eye, EyeOff, Check } from 'lucide-react';
import { useAuthStore, RegisterData } from '../store/AuthStore';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isLoading, error, isAuthenticated } = useAuthStore();

  // Get account type from URL query param (parent or teacher)
  const accountTypeParam = searchParams.get('type') as 'parent' | 'teacher' | null;
  const [accountType, setAccountType] = useState<'parent' | 'teacher'>(
    accountTypeParam === 'teacher' ? 'teacher' : 'parent'
  );

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    schoolName: '' // Optional, for teachers
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Calculate password strength
  useEffect(() => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    setPasswordStrength(strength);
  }, [formData.password]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Display name
    if (!formData.displayName.trim()) {
      errors.push('Name is required');
    }

    // Email
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.push('Please enter a valid email');
    }

    // Password
    if (!formData.password) {
      errors.push('Password is required');
    } else if (formData.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
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
      const registerData: RegisterData = {
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        accountType,
        ...(accountType === 'teacher' && formData.schoolName && {
          schoolName: formData.schoolName
        })
      };

      await register(registerData);
      toast.success(`Welcome to RoboStartup AI, ${formData.displayName}!`);
      navigate('/', { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
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

      {/* Register Card */}
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
          <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-gray-300">
            Join as a {accountType === 'teacher' ? 'Teacher' : 'Parent'} and start learning!
          </p>
        </div>

        {/* Account Type Selector */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20 mb-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAccountType('parent')}
            className={`py-2 px-4 rounded-lg font-semibold transition-all ${
              accountType === 'parent'
                ? 'bg-blue-600 text-white'
                : 'bg-transparent text-gray-300 hover:bg-white/5'
            }`}
          >
            👨‍👩‍👧 Parent
          </button>
          <button
            type="button"
            onClick={() => setAccountType('teacher')}
            className={`py-2 px-4 rounded-lg font-semibold transition-all ${
              accountType === 'teacher'
                ? 'bg-purple-600 text-white'
                : 'bg-transparent text-gray-300 hover:bg-white/5'
            }`}
          >
            👨‍🏫 Teacher
          </button>
        </div>

        {/* Register Form Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Display Name */}
            <div>
              <label className="block text-white font-medium mb-2">Your Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-white font-medium mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* School Name (Teachers only) */}
            {accountType === 'teacher' && (
              <div>
                <label className="block text-white font-medium mb-2">School Name (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <School className="text-gray-400" size={20} />
                  </div>
                  <input
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => handleInputChange('schoolName', e.target.value)}
                    placeholder="Lincoln Elementary"
                    className="w-full pl-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-white font-medium mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="At least 6 characters"
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[25, 50, 75, 100].map((threshold) => (
                      <div
                        key={threshold}
                        className={`h-1 flex-1 rounded ${
                          passwordStrength >= threshold
                            ? passwordStrength === 100
                              ? 'bg-green-500'
                              : passwordStrength >= 75
                              ? 'bg-yellow-500'
                              : 'bg-orange-500'
                            : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    Password strength: {
                      passwordStrength === 100 ? 'Strong' :
                      passwordStrength >= 75 ? 'Good' :
                      passwordStrength >= 50 ? 'Fair' : 'Weak'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-white font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-10 pr-10 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="text-gray-400 hover:text-white" size={20} />
                  ) : (
                    <Eye className="text-gray-400 hover:text-white" size={20} />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="flex items-center gap-1 mt-1 text-green-400 text-sm">
                  <Check size={14} />
                  <span>Passwords match</span>
                </div>
              )}
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 space-y-1"
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

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition-all ${
                isLoading
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : accountType === 'teacher'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Create {accountType === 'teacher' ? 'Teacher' : 'Parent'} Account</span>
                </>
              )}
            </button>

            {/* COPPA Notice for Parents */}
            {accountType === 'parent' && (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-200 text-xs">
                  <strong>COPPA Compliant:</strong> You'll be able to create accounts for your children (under 13) after registration.
                </p>
              </div>
            )}
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-300 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold underline">
                Log In
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
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

export default RegisterPage;