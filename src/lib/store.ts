import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  current_period_end: number | null;
  created_at: number;
  updated_at: number;
}

export interface Usage {
  images_this_week: number;
  limit: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  usage: Usage | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setUsage: (usage: Usage | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      subscription: null,
      usage: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user: User, token: string) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          subscription: null,
          usage: null,
          isAuthenticated: false,
        }),

      setLoading: (loading: boolean) =>
        set({
          isLoading: loading,
        }),

      setSubscription: (subscription: Subscription | null) =>
        set({
          subscription,
        }),

      setUsage: (usage: Usage | null) =>
        set({
          usage,
        }),
    }),
    {
      name: "auth-store",
    }
  )
);
