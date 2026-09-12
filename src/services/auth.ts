import type { LoginForm } from "../validation/Login.validation";
import { mockPassword, mockUsers } from "../mocks/platform";

// Autenticação exclusivamente demonstrativa, sem chamadas ao backend.
export const authService = {
  login({ email, password }: LoginForm) {
    const user = mockUsers.find((account) => account.email === email.trim().toLowerCase());
    if (!user || password !== mockPassword) {
      throw new Error("E-mail ou senha incorretos. Use uma das contas de demonstração.");
    }
    return { ...user };
  },
};

