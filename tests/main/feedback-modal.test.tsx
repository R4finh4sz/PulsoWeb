import Button from "@/components/ui/Button";
import { FeedbackModalContent } from "@/components/ui/FeedbackModal";
import { render, screen } from "@testing-library/react";

test("destaca a ação de descartar em vermelho e mantém continuar editando neutro", () => {
  render(<FeedbackModalContent
    type="error"
    title="Sair da criação do quiz?"
    message="O que você preencheu será perdido."
    actionLabel="Continuar editando"
    onClose={jest.fn()}
    secondaryAction={{ label: "Sair e descartar", onClick: jest.fn(), destructive: true }}
  />);
  expect(screen.getByRole("button", { name: "Sair e descartar" })).toHaveClass("bg-[#e83e32]", "text-white");
  expect(screen.getByRole("button", { name: "Continuar editando" })).not.toHaveClass("bg-[#e83e32]");
});

test("negar convite fica vermelho e aceitar mantém a cor principal", () => {
  render(<FeedbackModalContent type="invitation" title="Convite" message="Participar da matéria?" actionLabel="Aceitar" onClose={jest.fn()} secondaryAction={{ label: "Negar", onClick: jest.fn(), destructive: true }} />);
  expect(screen.getByRole("button", { name: "Negar" })).toHaveClass("bg-[#e83e32]", "text-white");
  expect(screen.getByRole("button", { name: "Aceitar" })).toHaveClass("bg-[var(--blue-dark)]");
});

test("tentar novamente não recebe o vermelho de ação destrutiva", () => {
  render(<FeedbackModalContent type="error" title="Erro" message="Tente novamente." onClose={jest.fn()} />);
  expect(screen.getByRole("button", { name: "Tentar novamente" })).toHaveClass("bg-[var(--blue-dark)]");
});

test("botão de perigo usa o vermelho padrão sem manter o fundo azul", () => {
  render(<Button variant="danger">Excluir</Button>);
  expect(screen.getByRole("button", { name: "Excluir" })).toHaveClass("bg-[#e83e32]", "enabled:hover:bg-[#cf3026]");
  expect(screen.getByRole("button", { name: "Excluir" })).not.toHaveClass("bg-[var(--blue-dark)]");
});
