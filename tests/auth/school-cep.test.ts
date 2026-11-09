jest.mock("@/mocks/access", () => ({
  ...jest.requireActual("@/mocks/access"),
  mockAccessEnabled: true,
}));

import { schoolsApi } from "@/integrations/schools/api";
import { useAuthState } from "@/integrations/auth/state";
import { createDemoSession, demoUsers } from "@/mocks/access";

afterEach(() => useAuthState.getState().setSession(null));

test("demonstração filtra escolas pelo CEP e respeita o contrato da busca", async () => {
  useAuthState.getState().setSession(createDemoSession(demoUsers[0]));
  const created = await schoolsApi.create({
    nome: "Escola CEP",
    cep: "99999000",
    logradouro: "Rua",
    bairro: "Centro",
    cidade: "Cidade",
    uf: "SP",
  });
  expect(await schoolsApi.searchByCep("99999000")).toMatchObject({
    content: [{ id: String(created.id), name: "Escola CEP", cep: "99999000" }],
    totalPages: 1,
  });
  expect(await schoolsApi.searchByCep("99999001")).toMatchObject({
    content: [],
    totalPages: 0,
  });
});
