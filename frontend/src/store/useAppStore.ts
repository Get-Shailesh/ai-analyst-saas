import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Dataset, AnalysisResult, ChatMessage } from "@/types";

// ── Auth slice ────────────────────────────────────────────────────────────────
interface AuthSlice {
  user: User | null;
  token: string | null;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
  logout: () => void;
}

// ── Dataset slice ─────────────────────────────────────────────────────────────
interface DatasetSlice {
  datasets: Dataset[];
  activeDataset: Dataset | null;
  setDatasets: (ds: Dataset[]) => void;
  setActiveDataset: (d: Dataset | null) => void;
  addDataset: (d: Dataset) => void;
}

// ── Analysis slice ────────────────────────────────────────────────────────────
interface AnalysisSlice {
  currentAnalysis: AnalysisResult | null;
  analysisHistory: AnalysisResult[];
  setCurrentAnalysis: (a: AnalysisResult | null) => void;
  addAnalysis: (a: AnalysisResult) => void;
}

// ── Chat slice ────────────────────────────────────────────────────────────────
interface ChatSlice {
  messages: ChatMessage[];
  addMessage: (m: ChatMessage) => void;
  clearChat: () => void;
}

// ── UI slice ──────────────────────────────────────────────────────────────────
interface UISlice {
  sidebarOpen: boolean;
  theme: "dark" | "light";
  toggleSidebar: () => void;
  setTheme: (t: "dark" | "light") => void;
}

type AppStore = AuthSlice & DatasetSlice & AnalysisSlice & ChatSlice & UISlice;

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () =>
        set({
          user: null,
          token: null,
          activeDataset: null,
          currentAnalysis: null,
          messages: [],
        }),

      // Dataset
      datasets: [],
      activeDataset: null,
      setDatasets: (datasets) => set({ datasets }),
      setActiveDataset: (activeDataset) => set({ activeDataset }),
      addDataset: (d) => set((s) => ({ datasets: [...s.datasets, d] })),

      // Analysis
      currentAnalysis: null,
      analysisHistory: [],
      setCurrentAnalysis: (a) => set({ currentAnalysis: a }),
      addAnalysis: (a) =>
        set((s) => ({ analysisHistory: [a, ...s.analysisHistory] })),

      // Chat
      messages: [],
      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      clearChat: () => set({ messages: [] }),

      // UI
      sidebarOpen: true,
      theme: "dark",
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "ai-analyst-store",
      partialize: (s) => ({
        token: s.token,
        user: s.user,
        theme: s.theme,
        activeDataset: s.activeDataset,
        datasets: s.datasets,
      }),
    },
  ),
);
