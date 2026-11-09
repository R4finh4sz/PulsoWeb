import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UserForm } from "@/components/screens/Integration/Users";
import { usersApi } from "@/integrations/users/api";
import { queryWrapper } from "../helpers";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: () => "/coordinator/students",
}));
jest.mock("@/integrations/users/api", () => ({
  usersApi: { update: jest.fn() },
}));

const user = {
  id: 1,
  fullName: "Ana Silva",
  ra: "123",
  email: "ana@example.com",
  role: "STUDENT" as const,
  classroomId: null,
  schoolId: 1,
};

test("email update accepts 254 characters and preserves format validation", async () => {
  jest.mocked(usersApi.update).mockResolvedValue(user);
  const { container } = render(
    <UserForm resource="students" existing={user} />,
    { wrapper: queryWrapper().wrapper },
  );
  const input = screen.getByLabelText("E-mail") as HTMLInputElement;
  expect(input).toHaveAttribute("maxlength", "254");
  expect(input).toBeRequired();
  fireEvent.change(input, { target: { value: "invalid-email" } });
  expect(input.validity.typeMismatch).toBe(true);
  const email =
    "a".repeat(64) +
    "@" +
    "b".repeat(63) +
    "." +
    "c".repeat(63) +
    "." +
    "d".repeat(57) +
    ".com";
  expect(email).toHaveLength(254);
  fireEvent.change(input, { target: { value: email } });
  expect(input).toBeValid();
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() =>
    expect(usersApi.update).toHaveBeenCalledWith("students", 1, {
      fullName: "Ana Silva",
      ra: "123",
      email,
      schoolId: undefined,
    }),
  );
});
