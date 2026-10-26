import AdminRequestsRoute from "@/app/admin/registration-requests/page";
import CoordinatorRequestsRoute from "@/app/coordinator/registration-requests/page";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { routeFixture, routeParams } from "../route-fixture";

import NewCoordinatorPage from "@/app/admin/coordinators/new/page";
import NewTeacherPage from "@/app/coordinator/teachers/new/page";
import { authApi } from "@/integrations/auth/api";
import { registrationApi } from "@/integrations/registration/api";
import { schoolsApi } from "@/integrations/schools/api";
import { findAddressByCep } from "@/utils/viacep";
import { queryWrapper, router } from "../helpers";
jest.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/admin",
}));
jest.mock("@/integrations/auth/api", () => ({
  authApi: { me: jest.fn(), logout: jest.fn() },
}));
jest.mock("@/integrations/registration/api", () => ({
  registrationApi: {
    list: jest.fn(),
    photo: jest.fn(),
    review: jest.fn(),
    invite: jest.fn(),
  },
}));
jest.mock("@/integrations/schools/api", () => ({
  schoolsApi: { list: jest.fn() },
}));
jest.mock("@/utils/viacep", () => ({
  ...jest.requireActual("@/utils/viacep"),
  findAddressByCep: jest.fn(),
}));
const request = {
  id: 1,
  name: "Ana Silva",
  email: "a@b.com",
  ra: "123",
  birthDate: "2000-01-01",
  role: "STUDENT" as const,
  schoolName: "Escola",
  status: "PENDING" as const,
  reviewReason: "Parecer",
  hasPhoto: true,
};
const school = {
  id: 1,
  nome: "Escola São Paulo",
  cnpj: "11222333000181",
  cidade: "São Paulo",
  bairro: "Centro",
  logradouro: "Rua Teste",
};
const InvitationPage = ({
  resource,
}: {
  resource: "teachers" | "coordinators";
}) =>
  resource === "coordinators" ? <NewCoordinatorPage /> : <NewTeacherPage />;
test("coordenação separa professores e alunos, busca e aprova sem transferências", async () => {
  jest
    .mocked(authApi.me)
    .mockResolvedValue({
      id: 2,
      role: "PEDAGOGICAL_COORDINATOR",
      fullName: "Coord",
      email: "c@b.com",
    } as Awaited<ReturnType<typeof authApi.me>>);
  jest.mocked(registrationApi.list).mockResolvedValue({
    content: [
      { ...request, hasPhoto: false },
      {
        ...request,
        id: 2,
        name: "Paula Mendes",
        email: "paula@exemplo.com",
        role: "TEACHER",
        hasPhoto: false,
      },
    ],
    totalPages: 1,
  });
  render(<RegistrationRequests role="coordenador" />, {
    wrapper: queryWrapper().wrapper,
  });
  expect(
    await screen.findByRole("button", {
      name: "Aprovar cadastro de Paula Mendes",
    }),
  ).toBeVisible();
  expect(screen.queryByText("Ana Silva")).not.toBeInTheDocument();
  expect(screen.queryByText("Transferências")).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "ausente" },
  });
  expect(
    screen.getByText("Nenhuma solicitação encontrada para esta busca."),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Alunos" }));
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Aprovar cadastro de Ana Silva",
    }),
  );
  await waitFor(() =>
    expect(registrationApi.review).toHaveBeenCalledWith(1, "APPROVED", ""),
  );
});
beforeEach(() => {
  jest
    .mocked(authApi.me)
    .mockResolvedValue({
      id: 1,
      role: "ADMIN",
      fullName: "Admin",
      email: "admin@b.com",
    } as Awaited<ReturnType<typeof authApi.me>>);
  jest
    .mocked(registrationApi.list)
    .mockResolvedValue({ content: [request], totalPages: 2 });
  jest.mocked(registrationApi.photo).mockResolvedValue(new Blob(["photo"]));
  jest.mocked(registrationApi.review).mockResolvedValue(request);
  jest.mocked(schoolsApi.list).mockResolvedValue([school]);
  jest.mocked(registrationApi.invite).mockResolvedValue({});
});
test("solicitações exibem foto, aprovam/recusam e paginam", async () => {
  render(<RegistrationRequests role="admin" />, {
    wrapper: queryWrapper().wrapper,
  });
  await screen.findByText("Ana Silva");
  expect(
    await screen.findByAltText("Foto enviada no cadastro"),
  ).toHaveAttribute("src", "blob:test");
  fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));
  await waitFor(() =>
    expect(registrationApi.review).toHaveBeenCalledWith(1, "APPROVED", ""),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Recusar" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Recusar" }));
  await waitFor(() =>
    expect(registrationApi.review).toHaveBeenCalledWith(1, "REJECTED", ""),
  );
  fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
  await waitFor(() =>
    expect(registrationApi.list).toHaveBeenLastCalledWith(
      "PENDING",
      1,
      expect.any(AbortSignal),
    ),
  );
  fireEvent.click(await screen.findByRole("button", { name: "Anterior" }));
  fireEvent.change(screen.getByLabelText("Situação"), {
    target: { value: "APPROVED" },
  });
  await screen.findByText("Cadastros aprovados");
  await screen.findByText("Ana Silva");
  expect(screen.queryByRole("button", { name: "Aprovar" })).toBeNull();
  fireEvent.change(screen.getByLabelText("Situação"), {
    target: { value: "REJECTED" },
  });
  await screen.findByText("Parecer: Parecer");
  cleanup();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
});
test("solicitações vazias e falhas podem ser consultadas novamente", async () => {
  jest
    .mocked(registrationApi.list)
    .mockRejectedValueOnce(new Error("Consulta indisponível"))
    .mockResolvedValue({ content: [], totalPages: 0 });
  render(<RegistrationRequests role="admin" />, {
    wrapper: queryWrapper().wrapper,
  });
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await screen.findByText("Nenhum cadastro encontrado.");
});
test("foto indisponível mostra erro e é cancelada no unmount", async () => {
  jest
    .mocked(registrationApi.photo)
    .mockRejectedValue(new Error("Foto indisponível"));
  const { unmount } = render(<RegistrationRequests role="admin" />, {
    wrapper: queryWrapper().wrapper,
  });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Foto indisponível",
  );
  const signal = jest.mocked(registrationApi.photo).mock.calls[0][1]!;
  unmount();
  expect(signal.aborted).toBe(true);
});
test.each(["teachers", "coordinators"] as const)(
  "convite para %s envia email e escola quando exigida",
  async (resource) => {
    if (resource === "teachers")
      jest
        .mocked(authApi.me)
        .mockResolvedValue({
          id: 1,
          role: "PEDAGOGICAL_COORDINATOR",
          fullName: "Coord",
          email: "c@b.com",
        } as Awaited<ReturnType<typeof authApi.me>>);
    const { container } = render(<InvitationPage resource={resource} />, {
      wrapper: queryWrapper().wrapper,
    });
    await screen.findByLabelText("E-mail");
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "a@b.com" },
    });
    if (resource === "coordinators") {
      fireEvent.click(screen.getByRole("button", { name: "Escola" }));
      fireEvent.change(screen.getByPlaceholderText("Nome, CNPJ ou CEP"), {
        target: { value: "São" },
      });
      fireEvent.click(
        await screen.findByRole("button", { name: /Escola São Paulo/ }),
      );
    }
    fireEvent.submit(container.querySelector("form")!);
    expect(
      await screen.findByText("Convite enviado por e-mail."),
    ).toBeVisible();
    expect(registrationApi.invite).toHaveBeenCalledWith(
      resource,
      resource === "coordinators"
        ? { email: "a@b.com", schoolId: 1 }
        : { email: "a@b.com" },
    );
  },
);
test("convite filtra CNPJ, nome e endereço do CEP e fecha menu externo", async () => {
  jest
    .mocked(findAddressByCep)
    .mockResolvedValue({ logradouro: "Rua Teste", localidade: "São Paulo" });
  render(<InvitationPage resource="coordinators" />, {
    wrapper: queryWrapper().wrapper,
  });
  await screen.findByLabelText("E-mail");
  fireEvent.click(screen.getByRole("button", { name: "Escola" }));
  const search = screen.getByPlaceholderText("Nome, CNPJ ou CEP");
  fireEvent.change(search, { target: { value: "Ausente" } });
  await screen.findByText("Nenhuma escola encontrada.");
  fireEvent.change(search, { target: { value: "11222" } });
  expect(
    screen.getByRole("button", { name: /Escola São Paulo/ }),
  ).toBeVisible();
  fireEvent.change(search, { target: { value: "01001000" } });
  await waitFor(() =>
    expect(findAddressByCep).toHaveBeenCalledWith("01001000"),
  );
  await screen.findByRole("button", { name: /Escola São Paulo/ });
  fireEvent.pointerDown(document.body);
  expect(screen.queryByPlaceholderText("Nome, CNPJ ou CEP")).toBeNull();
});
test("erro ao convidar mantém email para tentar novamente", async () => {
  jest
    .mocked(authApi.me)
    .mockResolvedValue({
      id: 1,
      role: "PEDAGOGICAL_COORDINATOR",
      fullName: "Coord",
      email: "c@b.com",
    } as Awaited<ReturnType<typeof authApi.me>>);
  jest.mocked(registrationApi.invite).mockRejectedValue(new Error("Falha"));
  const { container } = render(<InvitationPage resource="teachers" />, {
    wrapper: queryWrapper().wrapper,
  });
  fireEvent.change(await screen.findByLabelText("E-mail"), {
    target: { value: "a@b.com" },
  });
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Enviar convite" }),
    ).toBeEnabled(),
  );
  expect(screen.getByLabelText("E-mail")).toHaveValue("a@b.com");
});

const RegistrationRequests = routeFixture<{
  role: import("@/interfaces/auth").UserRole;
  initialType?: "TEACHER" | "DELETION";
}>((props) =>
  props.role === "admin" ? (
    <AdminRequestsRoute />
  ) : (
    <CoordinatorRequestsRoute
      searchParams={routeParams({
        type: props.initialType === "DELETION" ? "deletion" : "teacher",
      })}
    />
  ),
);
