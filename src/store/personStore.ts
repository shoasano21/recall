import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Person } from '../types';

const STORAGE_KEY = 'karte_persons';

type PersonStore = {
  persons: Person[];
  isLoaded: boolean;
  load: () => Promise<void>;
  add: (person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: string, updates: Partial<Omit<Person, 'id' | 'createdAt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  seedIfEmpty: () => Promise<void>;
};

const persist = async (persons: Person[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persons));
};

export const usePersonStore = create<PersonStore>((set, get) => ({
  persons: [],
  isLoaded: false,

  load: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: Array<Omit<Person, 'tags'> & { tags?: string[] }> = raw ? JSON.parse(raw) : [];
    // tags フィールドが存在しない古いデータをマイグレーション
    const persons: Person[] = parsed.map((p) => ({ ...p, tags: p.tags ?? [] }));
    set({ persons, isLoaded: true });
  },

  add: async (data) => {
    const now = new Date().toISOString();
    const person: Person = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: now,
      updatedAt: now,
    };
    const persons = [...get().persons, person];
    set({ persons });
    await persist(persons);
  },

  update: async (id, updates) => {
    const persons = get().persons.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    set({ persons });
    await persist(persons);
  },

  remove: async (id) => {
    const persons = get().persons.filter((p) => p.id !== id);
    set({ persons });
    await persist(persons);
  },

  seedIfEmpty: async () => {
    if (get().persons.length > 0) return;
    const now = new Date().toISOString();
    const seeds: Person[] = [
      {
        id: 'seed-1',
        name: '田中 誠',
        organization: '株式会社サンプル',
        relationship: '取引先',
        hobby: 'ゴルフ、読書',
        hometown: '大阪府',
        tags: ['取引先', 'ビジネス'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'seed-2',
        name: '佐藤 美咲',
        organization: '〇〇大学',
        relationship: '同期',
        hobby: '料理、旅行',
        hometown: '東京都',
        tags: ['同期', '大学'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'seed-3',
        name: '鈴木 健太',
        organization: '△△株式会社',
        relationship: '上司',
        hometown: '福岡県',
        tags: ['ビジネス', '上司'],
        createdAt: now,
        updatedAt: now,
      },
    ];
    set({ persons: seeds });
    await persist(seeds);
  },
}));
