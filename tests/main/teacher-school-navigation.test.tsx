import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { TeacherHome } from "@/components/screens/TeacherHome";
import { SchoolClassrooms } from "@/components/screens/TeacherHome/SchoolClassrooms";

jest.mock("@/components/screens/Dashboard/TeacherShell", () => ({ TeacherShell: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
jest.mock("@/components/screens/Integration/shared", () => ({
  Protected: ({ children }: { children: (user: object) => ReactNode }) => children({ id: "3", role: "professor" }),
  ErrorMessage: () => null,
}));
jest.mock("@/integrations/schools/hooks", () => ({ useSchools: () => ({
  isSuccess: true, isPending: false, data: [{ id: 2, nome: "Escola Central", cidade: "São Paulo", uf: "SP" }],
}) }));
jest.mock("@/integrations/classrooms/hooks", () => ({ useClassrooms: () => ({
  isSuccess: true, data: [{ id: 10, schoolId: 2 }, { id: 11, schoolId: 2 }, { id: 12, schoolId: 1 }],
}) }));
jest.mock("@/components/screens/Integration/Classrooms", () => ({ ClassroomList: ({ schoolId }: { schoolId: number }) => <section aria-label={`Turmas da escola ${schoolId}`} /> }));

test("escola da página inicial é um link para suas turmas com a contagem correta", () => {
  render(<TeacherHome />);
  expect(screen.getByRole("link", { name: /Escola Central/ })).toHaveAttribute("href", "/teacher/schools/2");
  expect(screen.getByText("2 turmas")).toBeVisible();
});

test("abrir a escola vinculada mostra suas turmas sem exigir troca de sessão", () => {
  render(<SchoolClassrooms id={2} />);
  expect(screen.getByRole("heading", { name: "Escola Central" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Turmas da escola 2" })).toBeVisible();
});
