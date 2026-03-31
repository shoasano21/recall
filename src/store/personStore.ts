import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Person } from '../types';

const STORAGE_KEY = 'karte_persons';

type PersonStore = {
  persons: Person[];
  isLoaded: boolean;
  load: () => Promise<void>;
  add: (person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Person>;
  update: (id: string, updates: Partial<Omit<Person, 'id' | 'createdAt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkSet: (persons: Person[]) => Promise<void>;
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
    const persons: Person[] = parsed.map((p) => ({
      ...p,
      tags: p.tags ?? [],
      highSchool: p.highSchool ?? undefined,
    }));
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
    return person;
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

  bulkSet: async (persons) => {
    set({ persons });
    await persist(persons);
  },

  seedIfEmpty: async () => {
    const persons = get().persons;

    // シードIDのデータが存在するが tags が空の場合 → タグだけ補完して終了
    const seedIds = ['seed-1', 'seed-2', 'seed-3', 'seed-4'];
    const seedTagMap: Record<string, string[]> = {
      'seed-1': ['取引先', 'ビジネス'],
      'seed-2': ['同期', '大学'],
      'seed-3': ['ビジネス', '上司'],
      'seed-4': ['友人', 'プライベート'],
    };
    const needsTagPatch = persons.some(
      (p) => seedIds.includes(p.id) && p.tags.length === 0
    );
    if (needsTagPatch) {
      const patched = persons.map((p) =>
        seedIds.includes(p.id) && p.tags.length === 0
          ? { ...p, tags: seedTagMap[p.id] ?? [] }
          : p
      );
      set({ persons: patched });
      await persist(patched);
      return;
    }

    if (persons.length > 0) return;
    const now = new Date().toISOString();
    const seeds: Person[] = [
      {
        id: 'seed-1',
        name: '田中 誠',
        organization: '株式会社テクノロジーズ',
        relationship: '取引先',
        hobby: 'ゴルフ、読書',
        hometown: '大阪府',
        note: '**得意分野**: マーケティング戦略\n- 月次MTGは第2水曜日\n- コーヒーはブラック派',
        tags: ['取引先', 'ビジネス'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'seed-2',
        name: '佐藤 美咲',
        organization: '〇〇大学 情報学部',
        relationship: '同期',
        hobby: '料理、旅行、写真',
        hometown: '東京都',
        note: '就活中。Web系志望。\nポートフォリオ作成を手伝う約束をした。',
        tags: ['同期', '大学'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'seed-3',
        name: '鈴木 健太',
        organization: '△△株式会社 営業部',
        relationship: '上司',
        hobby: 'ランニング、筋トレ',
        hometown: '福岡県',
        note: '毎朝7時出社。\n**注意**: 報告・連絡・相談は必ず対面で。',
        tags: ['ビジネス', '上司'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'seed-4',
        name: '山本 花',
        organization: 'フリーランス（デザイナー）',
        relationship: '友人',
        hobby: 'カフェ巡り、映画',
        hometown: '神奈川県',
        note: 'UIデザインが得意。\nコラボ案件の相談ができそう。',
        tags: ['友人', 'プライベート'],
        createdAt: now,
        updatedAt: now,
      },
    ];
    set({ persons: seeds });
    await persist(seeds);
  },
}));
