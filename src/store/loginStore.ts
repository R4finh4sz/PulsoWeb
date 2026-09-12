"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SessionUser } from "@/interfaces/auth";

type LoginState = {
  user: SessionUser | null;
  setUser: (user: SessionUser) => void;
  logout: () => void;
};

export const useLoginStore = create<LoginState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "pulso-demo-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

