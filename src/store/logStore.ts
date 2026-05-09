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
    const parsed: ConversationLog[] = raw ? JSON.parse(raw) : [];
    // 旧シード佐藤美咲（personId: seed-2）に紐づくログを削除
    const migrated = parsed.filter((l) => l.personId !== 'seed-2');
    if (migrated.length !== parsed.length) {
      await persist(migrated);
    }
    set({ logs: migrated, isLoaded: true });
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
    const now = new Date().toISOString();
    const seeds: ConversationLog[] = [
      {
        id: 'log-seed-1',
        personId: 'seed-1',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        isOnline: false,
        location: '渋谷オフィス',
        content: '新規プロジェクトの提案について打ち合わせ。来月中にプロトタイプを共有する約束をした。\n\n次回MTGは4月15日（火）14時〜。',
        createdAt: now,
      },
      {
        id: 'log-seed-2',
        personId: 'seed-1',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        isOnline: false,
        location: '新宿 会議室B',
        content: '初回顔合わせ。担当プロジェクトの概要を説明してもらった。趣味がゴルフと知り、共通の話題ができた。',
        createdAt: now,
      },
      {
        id: 'log-seed-4',
        personId: 'seed-3',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isOnline: false,
        location: '社内 打ち合わせスペース',
        content: '第1四半期の振り返りMTG。目標達成率92%で概ね好評価。来期の目標設定について来週までに資料を準備するよう指示があった。',
        createdAt: now,
      },
      {
        id: 'log-seed-5',
        personId: 'seed-4',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        isOnline: false,
        location: '代官山 カフェ',
        content: 'コラボ案件の相談。アプリのUIデザインを依頼できそう。\n来週サンプルデザインを送ってもらう予定。',
        createdAt: now,
      },
    ];
    set({ logs: seeds });
    await persist(seeds);
  },
}));
