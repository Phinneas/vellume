import {createMMKV, type MMKV} from 'react-native-mmkv';

export const API_URL = 'https://your-worker.workers.dev';

// Initialize MMKV storage
let storage: MMKV | null = null;

const getStorage = (): MMKV => {
  if (!storage) {
    storage = createMMKV({id: 'vellume-auth'});
  }
  return storage;
};

// Storage adapter for Better Auth
export const mmkvStorage = {
  getItem: (key: string): string | null => {
    return getStorage().getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    getStorage().set(key, value);
  },
  removeItem: (key: string): void => {
    getStorage().remove(key);
  },
};

// Auth types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Session {
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

// Auth client
export const authClient = {
  async signIn(email: string, password: string): Promise<Session> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({email, password}),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Sign in failed');
    }

    const data = await response.json();
    const session: Session = {
      token: data.session.token,
      user: data.user,
    };

    // Store session
    mmkvStorage.setItem('session', JSON.stringify(session));
    mmkvStorage.setItem('token', session.token);

    return session;
  },

  async signUp(
    name: string,
    email: string,
    password: string,
  ): Promise<Session> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({name, email, password}),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Sign up failed');
    }

    const data = await response.json();
    const session: Session = {
      token: data.session.token,
      user: data.user,
    };

    // Store session
    mmkvStorage.setItem('session', JSON.stringify(session));
    mmkvStorage.setItem('token', session.token);

    return session;
  },

  async signOut(): Promise<void> {
    const token = mmkvStorage.getItem('token');

    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Ignore logout errors
      }
    }

    // Clear stored session
    mmkvStorage.removeItem('session');
    mmkvStorage.removeItem('token');
  },

  getSession(): Session | null {
    const sessionStr = mmkvStorage.getItem('session');
    if (!sessionStr) {
      return null;
    }

    try {
      return JSON.parse(sessionStr) as Session;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return mmkvStorage.getItem('token');
  },
};
