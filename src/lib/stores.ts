import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Config {
  baseUrl: string;
  apiKey: string;
  model: string;
  suggestionsCount: number;
}

interface SFTData {
  id: string;
  instruction: string;
  input: string;
  output: string;
  createdAt: string;
}

interface Task {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'ready' | 'testing' | 'completed';
  path: string;
  createdAt: string;
}

interface AppState {
  config: Config;
  setConfig: (config: Partial<Config>) => void;

  dataList: SFTData[];
  setDataList: (data: SFTData[]) => void;
  addData: (data: SFTData) => void;
  removeData: (id: string) => void;

  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  removeTask: (id: string) => void;
}

const defaultConfig: Config = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  suggestionsCount: 3,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      setConfig: (config) =>
        set((state) => ({ config: { ...state.config, ...config } })),

      dataList: [],
      setDataList: (dataList) => set({ dataList }),
      addData: (data) =>
        set((state) => ({ dataList: [...state.dataList, data] })),
      removeData: (id) =>
        set((state) => ({
          dataList: state.dataList.filter((item) => item.id !== id),
        })),

      tasks: [],
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (id, task) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...task } : t
          ),
        })),
      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'seeking-data-storage',
    }
  )
);
