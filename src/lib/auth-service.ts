const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
  session: {
    token: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return response.json();
  },

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Signup failed");
    }

    return response.json();
  },

  async logout(): Promise<void> {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
    });
  },

  async getSession(): Promise<AuthResponse | null> {
    try {
      const response = await fetch(`${API_URL}/auth/session`);

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch {
      return null;
    }
  },
};
