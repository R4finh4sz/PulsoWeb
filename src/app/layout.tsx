import type { Metadata } from "next";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "./globals.css";
import { QueryProvider } from "@/api/QueryProvider";
import { FeedbackModalHost } from "@/components/ui/FeedbackModalHost";

export const metadata: Metadata = {
  title: "Pulso Escolar | Acesso",
  description: "Acompanhe o pulso da aprendizagem da sua turma.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body><QueryProvider>{children}</QueryProvider><FeedbackModalHost /></body>
    </html>
  );
}
