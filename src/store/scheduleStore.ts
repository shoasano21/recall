import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Schedule } from '../types';

const STORAGE_KEY = 'recall_schedules';

type ScheduleStore = {
  schedules: Schedule[];
  isLoaded: boolean;
  load: () => Promise<void>;
  add: (schedule: Omit<Schedule, 'id' | 'createdAt'>) => Promise<Schedule>;
  update: (id: string, patch: Partial<Omit<Schedule, 'id' | 'createdAt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkSet: (schedules: Schedule[]) => Promise<void>;
};

const persist = async (schedules: Schedule[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
};

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  schedules: [],
  isLoaded: false,

  load: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const schedules: Schedule[] = raw ? JSON.parse(raw) : [];
    set({ schedules, isLoaded: true });
  },

  add: async (data) => {
    const schedule: Schedule = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    const schedules = [...get().schedules, schedule];
    set({ schedules });
    await persist(schedules);
    return schedule;
  },

  update: async (id, patch) => {
    const schedules = get().schedules.map((s) =>
      s.id === id ? { ...s, ...patch } : s
    );
    set({ schedules });
    await persist(schedules);
  },

  remove: async (id) => {
    const schedules = get().schedules.filter((s) => s.id !== id);
    set({ schedules });
    await persist(schedules);
  },

  bulkSet: async (schedules) => {
    set({ schedules });
    await persist(schedules);
  },
}));
