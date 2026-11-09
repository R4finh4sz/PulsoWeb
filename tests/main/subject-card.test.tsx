import { SubjectCard } from "@/components/screens/ClassroomDetails/SubjectCard";
import { subjectsApi } from "@/integrations/subjects/api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { queryWrapper, session } from "../helpers";
import { useAuthState } from "@/integrations/auth/state";
beforeEach(() => useAuthState.getState().setSession(session));
afterEach(() => useAuthState.getState().setSession(null));
jest.mock("@/integrations/auth/hooks", () => ({
  useMe: () => ({ data: { id: 3 } }),
}));
jest.mock("@/mocks/access", () => ({
  ...jest.requireActual("@/mocks/access"),
  mockAccessEnabled: true,
  getDemoUser: () => ({ id: 3 }),
}));
jest.mock("@/integrations/subjects/api", () => ({
  subjectsApi: { invite: jest.fn() },
}));

test("menu abre convite separado do link da matéria e registra o professor convidado", async () => {
  jest.mocked(subjectsApi.invite).mockResolvedValue({
    id: 1,
    subjectId: 1,
    email: "prof@escola.com",
    status: "PENDING",
    classroomId: 1,
    subjectName: "Matemática",
    inviterName: "Paulo Professor",
  });
  render(
    <SubjectCard
      subject={{ id: 1, name: "Matemática", classroomId: 1, teacherId: 3 }}
      viewerId={3}
    />,
    { wrapper: queryWrapper().wrapper },
  );
  expect(screen.getByRole("link", { name: /Matemática/ })).toHaveAttribute(
    "href",
    "/teacher/classrooms/1/subjects/1",
  );
  fireEvent.click(screen.getByLabelText("Opções de Matemática"));
  expect(screen.getByRole("link", { name: "Ementa" })).toHaveAttribute(
    "href",
    "/teacher/classrooms/1/subjects/1/syllabus",
  );
  expect(screen.queryByText("Temas")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Adicionar professor" }));
  expect(screen.getByRole("dialog")).toBeVisible();
  fireEvent.change(
    screen.getByRole("textbox", { name: "E-mail do professor" }),
    { target: { value: "prof@escola.com" } },
  );
  fireEvent.submit(
    screen.getByRole("button", { name: "Convidar professor" }).closest("form")!,
  );
  await waitFor(() =>
    expect(subjectsApi.invite).toHaveBeenCalledWith(1, 1, "prof@escola.com"),
  );
  expect(await screen.findByRole("status")).toHaveTextContent("Convite criado");
});

test("matéria de outro professor fica com cadeado e sem link ou menu", () => {
  render(
    <SubjectCard
      subject={{
        id: 2,
        name: "Ciências",
        classroomId: 1,
        teacherId: 5,
        teacherIds: [5],
      }}
      viewerId={3}
    />,
    { wrapper: queryWrapper().wrapper },
  );
  expect(
    screen.getByRole("group", { name: "Ciências — Acesso bloqueado" }),
  ).toHaveAttribute("aria-disabled", "true");
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Opções de Ciências")).not.toBeInTheDocument();
});

test("professor aceito acessa a matéria, mas apenas o dono pode convidar", () => {
  render(
    <SubjectCard
      subject={{
        id: 2,
        name: "Ciências",
        classroomId: 1,
        teacherId: 5,
        teacherIds: [5, 3],
      }}
      viewerId={3}
    />,
    { wrapper: queryWrapper().wrapper },
  );
  expect(screen.getByRole("link", { name: /Ciências/ })).toHaveAttribute(
    "href",
    "/teacher/classrooms/1/subjects/2",
  );
  fireEvent.click(screen.getByLabelText("Opções de Ciências"));
  expect(screen.getByRole("link", { name: "Ementa" })).toHaveAttribute(
    "href",
    "/teacher/classrooms/1/subjects/2/syllabus",
  );
  expect(
    screen.queryByRole("button", { name: "Adicionar professor" }),
  ).not.toBeInTheDocument();
});
