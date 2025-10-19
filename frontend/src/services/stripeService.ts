// frontend/src/services/stripeService.ts
// Handles Stripe checkout and subscription management

import axios from 'axios';

// Get API URL from environment
const API_URL = import.meta.env.VITE_API_URL || 
                import.meta.env.VITE_BACKEND_URL || 
                'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api/stripe`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface CheckoutSessionResponse {
  success: boolean;
  sessionId?: string;
  url?: string;
  message?: string;
}

interface BillingPortalResponse {
  success: boolean;
  url?: string;
  message?: string;
}

class StripeService {
  /**
   * Create Stripe Checkout Session
   */
  async createCheckoutSession(priceId: string, tier: 'premium' | 'classroom'): Promise<CheckoutSessionResponse> {
    try {
      const response = await api.post<CheckoutSessionResponse>('/create-checkout-session', {
        priceId,
        tier
      });

      return response.data;
    } catch (error: any) {
      console.error('Checkout session error:', error);
      throw error;
    }
  }

  /**
   * Create Billing Portal Session (for managing subscriptions)
   */
  async createBillingPortalSession(): Promise<BillingPortalResponse> {
    try {
      const response = await api.post<BillingPortalResponse>('/create-portal-session');
      return response.data;
    } catch (error: any) {
      console.error('Billing portal error:', error);
      throw error;
    }
  }

  /**
   * Redirect to Stripe Checkout
   */
  async redirectToCheckout(priceId: string, tier: 'premium' | 'classroom'): Promise<void> {
    try {
      const { url, sessionId } = await this.createCheckoutSession(priceId, tier);
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else if (sessionId) {
        // Fallback: use Stripe.js (if you add it later)
        console.log('Session ID:', sessionId);
        window.location.href = url || '#';
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Redirect to Billing Portal
   */
  async redirectToBillingPortal(): Promise<void> {
    try {
      const { url } = await this.createBillingPortalSession();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton
export const stripeService = new StripeService();
export default stripeService;