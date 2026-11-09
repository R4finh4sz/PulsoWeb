import { fireEvent, render, screen } from "@testing-library/react";
import { ApiError } from "@/api/client";
import { RequestErrorModal } from "@/components/screens/Login/RequestErrorModal";
import { FeedbackModalHost } from "@/components/ui/FeedbackModalHost";
import { useFeedbackStore } from "@/store/feedbackStore";

beforeEach(() => useFeedbackStore.setState({ feedback: null }));
afterEach(() => useFeedbackStore.setState({ feedback: null }));

test("erro genérico abre modal, fecha e abre novamente para uma nova falha", () => {
  const { rerender } = render(
    <>
      <FeedbackModalHost />
      <RequestErrorModal
        error={
          new ApiError(500, "Não foi possível concluir a solicitação.", [
            "Serviço indisponível",
          ])
        }
      />
    </>,
  );
  expect(screen.getByRole("dialog", { name: "Erro" })).toBeVisible();
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent("Serviço indisponível");
  fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  rerender(
    <>
      <FeedbackModalHost />
      <RequestErrorModal error={new Error("Credenciais inválidas.")} />
    </>,
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
  rerender(
    <>
      <FeedbackModalHost />
      <RequestErrorModal error={null} />
    </>,
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
