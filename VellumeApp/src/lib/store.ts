import {create} from 'zustand';
import {createMMKV, type MMKV} from 'react-native-mmkv';
import {authClient, API_URL} from './auth';

// Subscription types
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

// Auth store
interface AuthStore {
  token: string | null;
  subscription: Subscription | null;
  usage: Usage | null;
  setToken: (token: string | null) => void;
  setSubscription: (subscription: Subscription | null) => void;
  setUsage: (usage: Usage | null) => void;
  fetchUserData: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: authClient.getToken(),
  subscription: null,
  usage: null,

  setToken: (token: string | null) => set({token}),

  setSubscription: (subscription: Subscription | null) => set({subscription}),

  setUsage: (usage: Usage | null) => set({usage}),

  fetchUserData: async () => {
    const token = get().token || authClient.getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        set({
          subscription: data.subscription,
          usage: data.usage,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  },
}));

// Initialize MMKV storage for journals
let journalStorage: MMKV | null = null;

const getJournalStorage = (): MMKV => {
  if (!journalStorage) {
    journalStorage = createMMKV({id: 'vellume-journals'});
  }
  return journalStorage;
};

// Journal type
export interface Journal {
  id: string;
  entry_text: string;
  mood: string;
  image_url?: string;
  created_at: number;
  updated_at: number;
  synced: boolean;
}

// Store state type
interface JournalStore {
  journals: Journal[];
  isLoading: boolean;
  error: string | null;
  loadJournals: () => void;
  addJournal: (
    entryText: string,
    mood: string,
    imageUrl?: string,
  ) => Promise<Journal>;
  updateJournal: (id: string, updates: Partial<Journal>) => void;
  deleteJournal: (id: string) => Promise<void>;
  setJournals: (journals: Journal[]) => void;
  syncJournals: () => Promise<void>;
  fetchJournalsFromAPI: () => Promise<void>;
}

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Create the store
export const useJournalStore = create<JournalStore>((set, get) => ({
  journals: [],
  isLoading: false,
  error: null,

  loadJournals: () => {
    try {
      const stored = getJournalStorage().getString('journals');
      if (stored) {
        const journals = JSON.parse(stored) as Journal[];
        set({journals});
      }
    } catch (error) {
      console.error('Failed to load journals:', error);
    }
  },

  addJournal: async (
    entryText: string,
    mood: string,
    imageUrl?: string,
  ): Promise<Journal> => {
    const now = Date.now();
    const newJournal: Journal = {
      id: generateId(),
      entry_text: entryText,
      mood,
      image_url: imageUrl,
      created_at: now,
      updated_at: now,
      synced: false,
    };

    // Add to local store
    const journals = [...get().journals, newJournal];
    set({journals});
    getJournalStorage().set('journals', JSON.stringify(journals));

    // Try to sync to API
    try {
      const token = authClient.getToken();
      const response = await fetch(`${API_URL}/api/journals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          entry_text: entryText,
          mood,
        }),
      });

      if (response.ok) {
        const apiJournal = await response.json();
        // Update with API id and mark as synced
        const updatedJournal: Journal = {
          ...newJournal,
          id: apiJournal.id,
          synced: true,
          image_url: imageUrl,
        };

        const updatedJournals = journals.map(j =>
          j.id === newJournal.id ? updatedJournal : j,
        );
        set({journals: updatedJournals});
        getJournalStorage().set('journals', JSON.stringify(updatedJournals));

        return updatedJournal;
      }
    } catch (error) {
      console.error('Failed to sync journal to API:', error);
    }

    return newJournal;
  },

  updateJournal: (id: string, updates: Partial<Journal>) => {
    const journals = get().journals.map(j =>
      j.id === id ? {...j, ...updates, updated_at: Date.now()} : j,
    );
    set({journals});
    getJournalStorage().set('journals', JSON.stringify(journals));
  },

  setJournals: (journals: Journal[]) => {
    set({journals});
    getJournalStorage().set('journals', JSON.stringify(journals));
  },

  deleteJournal: async (id: string) => {
    const journal = get().journals.find(j => j.id === id);

    // Remove from local store
    const journals = get().journals.filter(j => j.id !== id);
    set({journals});
    getJournalStorage().set('journals', JSON.stringify(journals));

    // Try to delete from API if synced
    if (journal?.synced) {
      try {
        const token = authClient.getToken();
        await fetch(`${API_URL}/api/journals/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Failed to delete journal from API:', error);
      }
    }
  },

  syncJournals: async () => {
    const unsyncedJournals = get().journals.filter(j => !j.synced);
    const token = authClient.getToken();

    for (const journal of unsyncedJournals) {
      try {
        const response = await fetch(`${API_URL}/api/journals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            entry_text: journal.entry_text,
            mood: journal.mood,
          }),
        });

        if (response.ok) {
          const apiJournal = await response.json();
          get().updateJournal(journal.id, {
            id: apiJournal.id,
            synced: true,
          });
        }
      } catch (error) {
        console.error('Failed to sync journal:', error);
      }
    }
  },

  fetchJournalsFromAPI: async () => {
    set({isLoading: true, error: null});

    try {
      const token = authClient.getToken();
      const response = await fetch(`${API_URL}/api/journals`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const apiJournals = await response.json();
        const localJournals = get().journals;
        const unsyncedLocal = localJournals.filter(j => !j.synced);
        
        const remoteJournals: Journal[] = apiJournals.map(
          (j: {
            id: string;
            entry_text: string;
            mood: string;
            created_at: string;
            updated_at?: string;
            image_url?: string;
          }) => ({
            id: j.id,
            entry_text: j.entry_text,
            mood: j.mood,
            image_url: j.image_url,
            created_at: new Date(j.created_at).getTime(),
            updated_at: j.updated_at ? new Date(j.updated_at).getTime() : new Date(j.created_at).getTime(),
            synced: true,
          }),
        );

        // Merge: keep unsynced local, add new remote
        const remoteIds = new Set(remoteJournals.map(j => j.id));
        const mergedJournals = [
          ...unsyncedLocal,
          ...remoteJournals.filter(j => !unsyncedLocal.some(local => local.id === j.id)),
        ];

        set({journals: mergedJournals, isLoading: false});
        getJournalStorage().set('journals', JSON.stringify(mergedJournals));
      } else {
        throw new Error('Failed to fetch journals');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch',
        isLoading: false,
      });
    }
  },
}));
