// frontend/src/store/AuthStore.ts
// Manages authentication state using Zustand (same pattern as GameStore)
// v2 — Updated User interface to match backend model (orgId, role, expanded subscription)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User interface matching backend User model
export interface User {
  id:           string;
  email:        string;
  displayName:  string;
  accountType:  'parent' | 'child' | 'teacher' | 'student' | 'admin';

  // ─── NEW: Organization & role ─────────────────────────────────────────────
  // orgId links the user to their school/district Organization record
  orgId?: string | null;

  // role reflects the user's license tier responsibility
  // teacher       = default, basic access
  // school_admin  = purchased/manages a School license
  // district_admin = purchased/manages a District license
  // student       = CTE student using the simulation
  role?: 'student' | 'teacher' | 'school_admin' | 'district_admin';

  // ─── Subscription — expanded for institutional tiers ─────────────────────
  subscription: {
    // Status values:
    // inactive  = no subscription, no trial
    // trialing  = active 14-day free trial
    // active    = paid and current
    // cancelled = user cancelled (access until licenseExpiry)
    // expired   = license or trial has expired
    // past_due  = Stripe payment failed, retrying
    status: 'inactive' | 'trialing' | 'active' | 'cancelled' | 'expired' | 'past_due' | 'free';

    // Tier values:
    // free       = no paid plan
    // trial      = trialing any tier
    // classroom  = $499/yr — 1 teacher, 35 students
    // school     = $1,999/yr — 10 teachers, 300 students
    // district   = $6,999/yr — unlimited
    // premium    = legacy individual plan (kept for backward compatibility)
    tier: 'free' | 'trial' | 'premium' | 'classroom' | 'school' | 'district';

    // Legacy fields — kept for backward compatibility
    currentPeriodEnd?:  Date | string;
    cancelAtPeriodEnd?: boolean;

    // NEW: trial and license expiry dates
    trialExpiry?:   Date | string | null;
    licenseExpiry?: Date | string | null;
  };

  // ─── Feature entitlements ─────────────────────────────────────────────────
  entitlements: {
    advancedMode:        boolean;
    legendaryAI:         boolean;
    maxChildren:         number;
    classroomFeatures?:  boolean;
    teacherDashboard?:   boolean;
    bulkStudentImport?:  boolean;
  };

  // ─── Game progress ────────────────────────────────────────────────────────
  gameProgress?: {
    gamesPlayed: number;
    totalScore:  number;
    bestScore:   number;
  };
}

interface AuthState {
  // State
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  error:           string | null;

  // Actions
  setUser:             (user: User | null) => void;
  setToken:            (token: string | null) => void;
  setLoading:          (loading: boolean) => void;
  setError:            (error: string | null) => void;
  login:               (email: string, password: string) => Promise<void>;
  register:            (data: RegisterData) => Promise<void>;
  logout:              () => void;
  checkAuth:           () => Promise<void>;
  updateSubscription:  (subscription: User['subscription']) => void;
}

export interface RegisterData {
  email:       string;
  password:    string;
  displayName: string;
  accountType: 'parent' | 'teacher';
  schoolName?: string;
}

// Create the auth store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user:            null,
      token:           null,
      isAuthenticated: false,
      isLoading:       false,
      error:           null,

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

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { authService } = await import('../services/authService');
          const response = await authService.login(email, password);

          set({
            user:            response.user,
            token:           response.token,
            isAuthenticated: true,
            isLoading:       false,
            error:           null
          });
        } catch (error: any) {
          set({
            error:           error.response?.data?.message || 'Login failed',
            isLoading:       false,
            isAuthenticated: false,
            user:            null,
            token:           null
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
            user:            response.user,
            token:           response.token,
            isAuthenticated: true,
            isLoading:       false,
            error:           null
          });
        } catch (error: any) {
          set({
            error:           error.response?.data?.message || 'Registration failed',
            isLoading:       false,
            isAuthenticated: false,
            user:            null,
            token:           null
          });
          throw error;
        }
      },

      // Logout action
      logout: () => {
        localStorage.removeItem('authToken');
        set({
          user:            null,
          token:           null,
          isAuthenticated: false,
          error:           null
        });
      },

      // Check if user is authenticated (verify token on app load)
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
            user:            response.user,
            token,
            isAuthenticated: true,
            isLoading:       false,
            error:           null
          });
        } catch (error) {
          // Token invalid or expired — clear everything
          localStorage.removeItem('authToken');
          set({
            user:            null,
            token:           null,
            isAuthenticated: false,
            isLoading:       false,
            error:           null
          });
        }
      },

      // Update subscription status (called after Stripe checkout completes)
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
        // Only persist token — user data is always fetched fresh on load
        token: state.token
      })
    }
  )
);