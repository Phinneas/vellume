// Hardcode the API URL to ensure it works in production
// The environment variable is optional for local development
const API_URL = "https://vellume-api.buzzuw2.workers.dev";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
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

export interface UserMeResponse {
  user: {
    id: string;
    name: string | null;
    email: string;
    created_at: number;
    updated_at: number;
  };
  subscription: Subscription | null;
  usage: Usage;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log("[Auth] Attempting login to:", `${API_URL}/api/auth/login`);
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      console.log("[Auth] Login response status:", response.status);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Login failed");
      }

      return response.json();
    } catch (error) {
      console.error("[Auth] Login error:", error);
      if (error instanceof TypeError) {
        console.error("[Auth] TypeError details:", error.message);
        throw new Error(`Unable to connect to server. Please check your internet connection. (${error.message})`);
      }
      throw error;
    }
  },

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      console.log("[Auth] Attempting signup to:", `${API_URL}/api/auth/signup`);
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      console.log("[Auth] Signup response status:", response.status);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Signup failed");
      }

      return response.json();
    } catch (error) {
      console.error("[Auth] Signup error:", error);
      if (error instanceof TypeError) {
        console.error("[Auth] TypeError details:", error.message);
        throw new Error(`Unable to connect to server. Please check your internet connection. (${error.message})`);
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    // Client-side logout - just clear local state
    // No server endpoint needed for JWT-based auth
  },

  async getUserMe(token: string): Promise<UserMeResponse> {
    const response = await fetch(`${API_URL}/api/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.message || "Failed to get user info");
    }

    return response.json();
  },
};
