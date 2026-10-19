"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useNotificationStore = create<{
  responses: Record<string, "ACCEPTED" | "REJECTED">;
  respond: (
    userId: string,
    notificationId: string,
    response: "ACCEPTED" | "REJECTED",
  ) => void;
}>()(
  persist(
    (set) => ({
      responses: {},
      respond: (userId, notificationId, response) =>
        set((state) => {
          const key = `${userId}:${notificationId}`;
          if (state.responses[key]) return state;
          return { responses: { ...state.responses, [key]: response } };
        }),
    }),
    {
      name: "pulso-notifications",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
