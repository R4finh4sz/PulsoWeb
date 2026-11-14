import { passwordError } from "@/validation/password";
import { LoginSchema } from "@/validation/Login.validation";

test("prioriza limite de bytes quando a senha também falha na complexidade", () => {
  expect(passwordError("é".repeat(37))).toBe("A senha deve ter no máximo 72 bytes UTF-8.");
});
test.each(["Short1", "lowercase1", "Uppercase", "Ab1" + "\u00e9".repeat(35)])(
  "rejects invalid new password %s",
  (password) => {
    expect(passwordError(password)).not.toBeNull();
  },
);
test.each([
  "Password1",
  "Ab1" + "a".repeat(69),
  "Ab1" + "\u00e9".repeat(34) + "a",
])("accepts password within UTF-8 boundary", (password) => {
  expect(passwordError(password)).toBeNull();
});
test("login accepts existing passwords without complexity checks", () => {
  expect(
    LoginSchema.safeParse({ email: "a@b.com", password: "old" }).success,
  ).toBe(true);
});
