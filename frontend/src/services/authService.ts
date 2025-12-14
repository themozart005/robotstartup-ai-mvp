// frontend/src/services/authService.ts
// Handles all authentication API calls

import axios from 'axios';
import type { User, RegisterData } from '../store/AuthStore';

// Get API URL from environment
const API_URL = import.meta.env.VITE_API_URL || 
                import.meta.env.VITE_BACKEND_URL || 
                'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interfaces
interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ msg: string; param: string }>;
}

class AuthService {
  /**
   * Register a new parent account
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const endpoint = data.accountType === 'teacher' 
        ? '/register-teacher' 
        : '/register';

      const response = await api.post<AuthResponse>(endpoint, {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        ...(data.schoolName && { schoolName: data.schoolName })
      });

      // Store token
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }

      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/login', {
        email,
        password
      });

      // Store token
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Get current user (verify token)
   */
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const response = await api.get<AuthResponse>('/me');
      return response.data;
    } catch (error: any) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * Logout (client-side only, token is stateless)
   */
  logout(): void {
    localStorage.removeItem('authToken');
  }

  /**
   * Check if user has specific entitlement
   */
  hasEntitlement(user: User | null, entitlement: keyof User['entitlements']): boolean {
    if (!user) return false;
    return user.entitlements[entitlement] === true;
  }

  /**
   * Check if user is subscribed (has premium/classroom)
   */
  isSubscribed(user: User | null): boolean {
    if (!user) return false;
    return user.subscription.tier !== 'free' && 
           user.subscription.status === 'active';
  }

  /**
   * Get subscription tier display name
   */
  getTierDisplayName(tier: string): string {
    switch (tier) {
      case 'free': return 'Free';
      case 'premium': return 'Premium';
      case 'classroom': return 'Classroom';
      default: return tier;
    }
  }

  // ============================================
  // CHILD ACCOUNT MANAGEMENT (NEW)
  // ============================================

  /**
   * Create a child/student account
   */
  async createChild(data: {
    displayName: string;
    age: number;
    grade: string;
  }): Promise<{ success: boolean; child: User; message: string }> {
    try {
      const response = await api.post('/create-child', data);
      return response.data;
    } catch (error: any) {
      console.error('Create child error:', error);
      throw error;
    }
  }

  /**
   * Get all child accounts for current user
   */
  async getMyChildren(): Promise<{ success: boolean; children: User[] }> {
    try {
      const response = await api.get('/my-children');
      return response.data;
    } catch (error: any) {
      console.error('Get children error:', error);
      throw error;
    }
  }

  /**
   * Delete a child account
   */
  async deleteChild(childId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/child/${childId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete child error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
