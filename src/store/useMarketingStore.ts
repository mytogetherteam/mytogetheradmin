import { create } from "zustand";
import type { MarketingSectionPermission } from "@/utils/marketingAccess";

const STORAGE_KEY = "marketing_permissions";

function readStored(): MarketingSectionPermission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface MarketingStore {
  sections: MarketingSectionPermission[];
  ready: boolean;
  setSections: (sections: MarketingSectionPermission[]) => void;
  markReady: () => void;
  clear: () => void;
}

export const useMarketingStore = create<MarketingStore>((set) => ({
  sections: readStored(),
  ready: readStored().length > 0,
  setSections: (sections) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    set({ sections, ready: true });
  },
  markReady: () => set({ ready: true }),
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ sections: [], ready: false });
  },
}));
