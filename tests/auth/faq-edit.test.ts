jest.mock("@/mocks/access", () => ({
  ...jest.requireActual("@/mocks/access"),
  mockAccessEnabled: true,
}));

import { faqsApi } from "@/integrations/faqs/api";
import { useAuthState } from "@/integrations/auth/state";
import { createDemoSession, demoUsers } from "@/mocks/access";

afterEach(() => useAuthState.getState().setSession(null));

test("FAQ de demonstração permite admin editar e respeita o destinatário", async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers[0]));
  const faq = await faqsApi.create({
    title: "Pergunta",
    message: "Resposta",
    targetRole: "TEACHER",
  });
  await faqsApi.update(faq.id!, {
    title: "Editada",
    message: "Nova resposta",
    targetRole: "PEDAGOGICAL_COORDINATOR",
  });
  expect(await faqsApi.list()).toContainEqual({
    id: faq.id,
    title: "Editada",
    message: "Nova resposta",
    targetRole: "PEDAGOGICAL_COORDINATOR",
  });
  useAuthState.getState().setSession(createDemoSession(demoUsers[2]));
  expect(await faqsApi.list()).toEqual([]);
  await expect(
    faqsApi.update(faq.id!, {
      title: "Negada",
      message: "Resposta",
      targetRole: "TEACHER",
    }),
  ).rejects.toThrow("Somente administradores");
  useAuthState.getState().setSession(createDemoSession(demoUsers[1]));
  expect(await faqsApi.list()).toHaveLength(1);
});
