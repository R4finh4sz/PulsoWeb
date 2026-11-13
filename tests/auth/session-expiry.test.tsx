import { act, fireEvent, render, screen } from "@testing-library/react";
import { SessionExpiry } from "@/components/screens/Login/AuthGate/SessionExpiry";

beforeEach(() => jest.useFakeTimers());

test("avisa ao receber o sinal do backend sem repetir após fechar", () => {
  const expiresAt = new Date(Date.now() + 2 * 60_000).toISOString();
  const { rerender } = render(<SessionExpiry expiresAt={expiresAt} />);
  rerender(<SessionExpiry expiresAt={expiresAt} expiring />);
  expect(screen.getByRole("dialog", { name: "Sua sessão está terminando" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
  rerender(<SessionExpiry expiresAt={expiresAt} expiring />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("avisa a um minuto, permite fechar e reinicia após renovação", () => {
  const expiry = new Date(Date.now() + 2 * 60_000).toISOString();
  const { rerender } = render(<SessionExpiry key={expiry} expiresAt={expiry} />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  act(() => jest.advanceTimersByTime(60_000));
  expect(screen.getByRole("dialog", { name: "Sua sessão está terminando" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  const renewed = new Date(Date.now() + 10 * 60_000).toISOString();
  rerender(<SessionExpiry key={renewed} expiresAt={renewed} />);
  act(() => jest.advanceTimersByTime(9 * 60_000));
  expect(screen.getByRole("dialog")).toBeVisible();
});

test("recalcula ao voltar para a aba", () => {
  const start = Date.now();
  render(<SessionExpiry expiresAt={new Date(start + 2 * 60_000).toISOString()} />);
  jest.setSystemTime(start + 90_000);
  fireEvent(window, new Event("focus"));
  expect(screen.getByRole("dialog")).toBeVisible();
});
