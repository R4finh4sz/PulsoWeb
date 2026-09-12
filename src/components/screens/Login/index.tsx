import { LoginFields } from "./LoginFields";
import { LoginHeader } from "./LoginHeader";
import { LoginIntro } from "./LoginIntro";

export function Login() {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      <LoginIntro />
      <section aria-label="Acesso à plataforma" className="flex min-h-[580px] items-center justify-center px-6 py-14 sm:px-12 lg:px-20">
        <div className="w-full max-w-[480px] rise-in rise-in-delay">
          <LoginHeader />
          <LoginFields />
        </div>
      </section>
    </main>
  );
}