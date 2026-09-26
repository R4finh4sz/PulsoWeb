"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Role } from "../types";

export type LoginResponse = {
  accessToken: string; tokenType: string; expiresAt: string;
  twoFactorRequired: boolean; codeExpiresAt: string; resendAvailableAt: string;
  user: { role: Role; classroomId: number | null; schoolId: number | null; firstLogin: boolean; termsAccepted: boolean; termsAcceptedVersions: string[] };
};
export const useAuthState = create<{
  session: LoginResponse | null;
  setSession: (session: LoginResponse | null) => void;
}>()(persist((set) => ({ session: null, setSession: session => set({ session }) }), {
  name: "pulso-auth-v2", storage: createJSONStorage(() => sessionStorage),
  partialize: state => ({ session: state.session }),
}));
