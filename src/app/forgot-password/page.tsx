import { PasswordRecovery } from "@/components/screens/ForgotPassword";
import { LoginIntro } from "@/components/screens/Login/LoginIntro";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      <LoginIntro />
      <PasswordRecovery />
    </main>
  );
}
