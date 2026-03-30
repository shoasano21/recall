import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConversationLog } from '../types';

const STORAGE_KEY = 'karte_logs';

type LogStore = {
  logs: ConversationLog[];
  isLoaded: boolean;
  load: () => Promise<void>;
  add: (log: Omit<ConversationLog, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: string, updates: Partial<Omit<ConversationLog, 'id' | 'personId' | 'createdAt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  removeByPersonId: (personId: string) => Promise<void>;
  bulkSet: (logs: ConversationLog[]) => Promise<void>;
  getByPersonId: (personId: string) => ConversationLog[];
  seedIfEmpty: () => Promise<void>;
};

const persist = async (logs: ConversationLog[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
};

export const useLogStore = create<LogStore>((set, get) => ({
  logs: [],
  isLoaded: false,

  load: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const logs: ConversationLog[] = raw ? JSON.parse(raw) : [];
    set({ logs, isLoaded: true });
  },

  add: async (data) => {
    const log: ConversationLog = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    const logs = [...get().logs, log];
    set({ logs });
    await persist(logs);
  },

  update: async (id, updates) => {
    const logs = get().logs.map((l) => (l.id === id ? { ...l, ...updates } : l));
    set({ logs });
    await persist(logs);
  },

  remove: async (id) => {
    const logs = get().logs.filter((l) => l.id !== id);
    set({ logs });
    await persist(logs);
  },

  removeByPersonId: async (personId) => {
    const logs = get().logs.filter((l) => l.personId !== personId);
    set({ logs });
    await persist(logs);
  },

  bulkSet: async (logs) => {
    set({ logs });
    await persist(logs);
  },

  getByPersonId: (personId) =>
    get()
      .logs.filter((l) => l.personId === personId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

  seedIfEmpty: async () => {
    if (get().logs.length > 0) return;
    const seeds: ConversationLog[] = [
      {
        id: 'log-seed-1',
        personId: 'seed-1',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        isOnline: false,
        location: '東京オフィス',
        content: '新規プロジェクトの提案について打ち合わせ。来月中にプロトタイプを共有する約束をした。',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'log-seed-2',
        personId: 'seed-2',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        isOnline: true,
        content: '近況報告。就活の相談に乗った。',
        createdAt: new Date().toISOString(),
      },
    ];
    set({ logs: seeds });
    await persist(seeds);
  },
}));
