// frontend/src/services/stripeService.ts
// Handles Stripe checkout and subscription management
// v2 — Updated for tiered institutional licensing (classroom, school, district)

import axios from 'axios';

// Get API URL from environment
const API_URL = import.meta.env.VITE_API_URL ||
                import.meta.env.VITE_BACKEND_URL ||
                'http://localhost:5000';

// Create axios instance — now points to /api/payments
const api = axios.create({
  baseURL: `${API_URL}/api/payments`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response types ───────────────────────────────────────────────────────────

interface CheckoutResponse {
  success: boolean;
  url?: string;
  message?: string;
}

interface TrialResponse {
  success: boolean;
  message?: string;
  orgId?: string;
  expiry?: string;
}

interface PortalResponse {
  success: boolean;
  url?: string;
  message?: string;
}

interface LicenseStatusResponse {
  success: boolean;
  subscription?: {
    tier: string;
    status: string;
    trialExpiry?: string;
    licenseExpiry?: string;
  };
  org?: {
    name: string;
    type: string;
    licenseStatus: string;
    allowedTeachers: number | null;
    allowedStudents: number | null;
    modules: string[];
    features: Record<string, boolean>;
  };
  role?: string;
}

interface PricingResponse {
  success: boolean;
  tiers?: Array<{
    id: string;
    name: string;
    price: number;
    features: string[];
    highlighted: boolean;
  }>;
}

// ─── Service class ────────────────────────────────────────────────────────────

class StripeService {

  /**
   * Get pricing tiers (public — no auth required)
   */
  async getPricing(): Promise<PricingResponse> {
    try {
      const response = await api.get<PricingResponse>('/pricing');
      return response.data;
    } catch (error: any) {
      console.error('Pricing fetch error:', error);
      throw error;
    }
  }

  /**
   * Start a 14-day free trial — no credit card required
   * @param tier      'classroom' | 'school' | 'district'
   * @param orgName   Name of the school or district
   */
  async startTrial(tier: 'classroom' | 'school' | 'district', orgName: string): Promise<TrialResponse> {
    try {
      const response = await api.post<TrialResponse>('/start-trial', { tier, orgName });
      return response.data;
    } catch (error: any) {
      console.error('Start trial error:', error);
      throw error;
    }
  }

  /**
   * Create a Stripe Checkout session for a paid license purchase
   * @param tier      'classroom' | 'school' | 'district'
   * @param orgName   Name of the school or district
   */
  async createCheckoutSession(
    tier: 'classroom' | 'school' | 'district',
    orgName: string
  ): Promise<CheckoutResponse> {
    try {
      const response = await api.post<CheckoutResponse>('/create-checkout', { tier, orgName });
      return response.data;
    } catch (error: any) {
      console.error('Checkout session error:', error);
      throw error;
    }
  }

  /**
   * Redirect to Stripe Checkout page
   * @param tier      'classroom' | 'school' | 'district'
   * @param orgName   Name of the school or district
   */
  async redirectToCheckout(
    tier: 'classroom' | 'school' | 'district',
    orgName: string
  ): Promise<void> {
    try {
      const { url } = await this.createCheckoutSession(tier, orgName);
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Open Stripe Customer Portal (manage billing, cancel subscription)
   */
  async createBillingPortalSession(): Promise<PortalResponse> {
    try {
      const response = await api.post<PortalResponse>('/customer-portal');
      return response.data;
    } catch (error: any) {
      console.error('Billing portal error:', error);
      throw error;
    }
  }

  /**
   * Redirect to Stripe Billing Portal
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

  /**
   * Get current user's license and org status
   */
  async getLicenseStatus(): Promise<LicenseStatusResponse> {
    try {
      const response = await api.get<LicenseStatusResponse>('/license-status');
      return response.data;
    } catch (error: any) {
      console.error('License status error:', error);
      throw error;
    }
  }

  /**
   * Check if a user's license/trial is currently active
   * Pass in the subscription object from getLicenseStatus()
   */
  isLicenseActive(subscription?: LicenseStatusResponse['subscription']): boolean {
    if (!subscription) return false;
    const now = new Date();

    if (subscription.status === 'active' && subscription.licenseExpiry) {
      return new Date(subscription.licenseExpiry) > now;
    }
    if (subscription.status === 'trialing' && subscription.trialExpiry) {
      return new Date(subscription.trialExpiry) > now;
    }
    return false;
  }

  /**
   * Get a human-readable tier name
   */
  getTierDisplayName(tier: string): string {
    switch (tier) {
      case 'classroom': return 'Classroom License';
      case 'school':    return 'School License';
      case 'district':  return 'District License';
      case 'trial':     return 'Free Trial';
      case 'free':      return 'Free';
      case 'premium':   return 'Premium'; // legacy
      default:          return tier;
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();
export default stripeService;