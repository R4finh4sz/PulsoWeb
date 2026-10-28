import { LoginIntro } from "@/components/screens/Login/LoginIntro";
import { RegistrationForm } from "@/components/screens/Registration";

export default function RegistrationPage() {

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      <LoginIntro />
      <RegistrationForm />
    </main>
  );
}
