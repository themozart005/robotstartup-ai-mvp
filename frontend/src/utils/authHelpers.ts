// frontend/src/utils/authHelpers.ts
// Helper functions for authentication

import type { User } from '../store/AuthStore';

/**
 * Check if token exists in localStorage
 */
export const hasToken = (): boolean => {
  return !!localStorage.getItem('authToken');
};

/**
 * Get token from localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Remove token from localStorage
 */
export const clearToken = (): void => {
  localStorage.removeItem('authToken');
};

/**
 * Check if user is a parent
 */
export const isParent = (user: User | null): boolean => {
  return user?.accountType === 'parent';
};

/**
 * Check if user is a teacher
 */
export const isTeacher = (user: User | null): boolean => {
  return user?.accountType === 'teacher';
};

/**
 * Check if user is a child
 */
export const isChild = (user: User | null): boolean => {
  return user?.accountType === 'child';
};

/**
 * Check if user can create child accounts
 */
export const canCreateChildren = (user: User | null): boolean => {
  return isParent(user) || isTeacher(user);
};

/**
 * Check if user has reached max children limit
 */
export const hasReachedChildLimit = (user: User | null, currentChildren: number): boolean => {
  if (!user) return true;
  return currentChildren >= user.entitlements.maxChildren;
};

/**
 * Check if user has premium features
 */
export const hasPremiumAccess = (user: User | null): boolean => {
  if (!user) return false;
  return user.subscription.tier === 'premium' || 
         user.subscription.tier === 'classroom';
};

/**
 * Check if user has classroom features
 */
export const hasClassroomAccess = (user: User | null): boolean => {
  if (!user) return false;
  return user.subscription.tier === 'classroom' && 
         user.entitlements.classroomFeatures === true;
};

/**
 * Check if user has advanced mode access
 */
export const hasAdvancedMode = (user: User | null): boolean => {
  if (!user) return false;
  return user.entitlements.advancedMode === true;
};

/**
 * Format subscription status for display
 */
export const getSubscriptionStatus = (user: User | null): string => {
  if (!user) return 'Not logged in';
  
  const { status, tier, cancelAtPeriodEnd } = user.subscription;
  
  if (tier === 'free') return 'Free Plan';
  if (status === 'active' && !cancelAtPeriodEnd) return `${tier} (Active)`;
  if (status === 'active' && cancelAtPeriodEnd) return `${tier} (Cancelling)`;
  if (status === 'past_due') return `${tier} (Payment Failed)`;
  if (status === 'cancelled') return 'Cancelled';
  
  return tier;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { 
  valid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get greeting based on time of day
 */
export const getGreeting = (user: User | null): string => {
  if (!user) return 'Welcome';
  
  const hour = new Date().getHours();
  const name = user.displayName;
  
  if (hour < 12) return `Good morning, ${name}!`;
  if (hour < 18) return `Good afternoon, ${name}!`;
  return `Good evening, ${name}!`;
};

/**
 * Check if subscription is expiring soon (within 7 days)
 */
export const isSubscriptionExpiringSoon = (user: User | null): boolean => {
  if (!user || !user.subscription.currentPeriodEnd) return false;
  
  const expiryDate = new Date(user.subscription.currentPeriodEnd);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
};

/**
 * Format date for subscription display
 */
export const formatSubscriptionDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};