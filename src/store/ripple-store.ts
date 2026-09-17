import { create } from "zustand";
import { simulateCompromise } from "@/lib/ripple/simulate";
import type { AttackType, SimResult, ViewId } from "@/lib/ripple/types";

interface RippleState {
  view: ViewId;
  selectedId: string | null;
  hoverId: string | null;
  compromisedId: string | null;
  attack: AttackType;
  sim: SimResult | null;
  query: string;
  inspectorOpen: boolean;
  setView: (v: ViewId) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setAttack: (a: AttackType) => void;
  setQuery: (q: string) => void;
  runSim: (id?: string) => void;
  clearSim: () => void;
  setInspector: (open: boolean) => void;
}

export const useRipple = create<RippleState>((set, get) => ({
  view: "overview",
  selectedId: null,
  hoverId: null,
  compromisedId: null,
  attack: "malicious-release",
  sim: null,
  query: "",
  inspectorOpen: false,
  setView: (view) => set({ view }),
  select: (selectedId) => set({ selectedId, inspectorOpen: Boolean(selectedId) }),
  hover: (hoverId) => set({ hoverId }),
  setAttack: (attack) => set({ attack }),
  setQuery: (query) => set({ query }),
  runSim: (id) => {
    const source = id ?? get().selectedId ?? get().compromisedId;
    if (!source) return;
    const sim = simulateCompromise(source, get().attack);
    set({
      compromisedId: source,
      selectedId: source,
      sim,
      view: "simulate",
      inspectorOpen: true,
    });
  },
  clearSim: () => set({ compromisedId: null, sim: null }),
  setInspector: (inspectorOpen) => set({ inspectorOpen }),
}));
