import { create } from "zustand";

type LoginState = {
  submittedEmail: string | null;
  setSubmittedEmail: (email: string | null) => void;
};

export const useLoginStore = create<LoginState>((set) => ({
  submittedEmail: null,
  setSubmittedEmail: (submittedEmail) => set({ submittedEmail }),
}));