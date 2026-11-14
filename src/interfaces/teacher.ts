import type { SessionUser } from "./auth";

export type Teacher = SessionUser & { role: "professor"; registration: string };
