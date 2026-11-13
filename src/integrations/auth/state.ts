"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Role } from "../types";

export type LoginResponse = {
  schoolUnavailable?: boolean;
  schoolAccessStatus?: string | null;
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  sessionExpiring?: boolean;
  refreshToken?: string | null;
  refreshExpiresAt?: string | null;
  twoFactorRequired: boolean;
  twoFactorEnabled?: boolean;
  codeExpiresAt: string | null;
  resendAvailableAt: string | null;
  user: {
    schoolUnavailable?: boolean;
    schoolAccessStatus?: string | null;
    role: Role;
    classroomId: number | null;
    schoolIds?: number[];
    activeSchoolId?: number | null;
    schoolId: number | null;
    firstLogin: boolean;
    termsAccepted: boolean;
    termsAcceptedVersions: string[];
  };
};
export const useAuthState = create<{
  session: LoginResponse | null;
  setSession: (session: LoginResponse | null) => void;
}>()(
  persist(
    (set) => ({ session: null, setSession: (session) => set({ session }) }),
    {
      name: "pulso-auth-v2",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ session: state.session }),
    },
  ),
);
