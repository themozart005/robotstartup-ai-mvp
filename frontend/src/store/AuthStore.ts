// frontend/src/store/AuthStore.ts
// Manages authentication state using Zustand (same pattern as GameStore)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User interface matching backend User model
export interface User {
  id: string;
  email: string;
  displayName: string;
  accountType: 'parent' | 'child' | 'teacher' | 'student';
  subscription: {
    status: string;
    tier: 'free' | 'premium' | 'classroom';
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  };
  entitlements: {
    advancedMode: boolean;
    legendaryAI: boolean;
    maxChildren: number;
    classroomFeatures?: boolean;
    teacherDashboard?: boolean;
  };
  gameProgress?: {
    gamesPlayed: number;
    totalScore: number;
    bestScore: number;
  };
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateSubscription: (subscription: User['subscription']) => void;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  accountType: 'parent' | 'teacher';
  schoolName?: string;
}

// Create the auth store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Set user
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          error: null 
        });
      },

      // Set token
      setToken: (token) => {
        set({ token });
        if (token) {
          localStorage.setItem('authToken', token);
        } else {
          localStorage.removeItem('authToken');
        }
      },

      // Set loading
      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // Set error
      setError: (error) => {
        set({ error, isLoading: false });
      },

      // Login action (will be implemented with authService)
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // This will be implemented in authService
          const { authService } = await import('../services/authService');
          const response = await authService.login(email, password);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Login failed',
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null
          });
          throw error;
        }
      },

      // Register action
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const { authService } = await import('../services/authService');
          const response = await authService.register(data);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Registration failed',
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null
          });
          throw error;
        }
      },

      // Logout action
      logout: () => {
        localStorage.removeItem('authToken');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      // Check if user is authenticated (verify token)
      checkAuth: async () => {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        
        try {
          const { authService } = await import('../services/authService');
          const response = await authService.getCurrentUser();
          
          set({
            user: response.user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('authToken');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      // Update subscription status (called after Stripe checkout)
      updateSubscription: (subscription) => {
        const user = get().user;
        if (user) {
          set({
            user: {
              ...user,
              subscription
            }
          });
        }
      }
    }),
    {
      name: 'auth-storage', // LocalStorage key
      partialize: (state) => ({
        // Only persist token (user data will be fetched on load)
        token: state.token
      })
    }
  )
);