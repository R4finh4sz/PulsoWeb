"use client";

import { DemoAccess } from "@/components/screens/Login/DemoAccess";
import { LoginFields } from "@/components/screens/Login/LoginFields";
import { LoginHeader } from "@/components/screens/Login/LoginHeader";
import { LoginIntro } from "@/components/screens/Login/LoginIntro";

export default function Home() {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      <LoginIntro />
      <section
        aria-label="Acesso à plataforma"
        className="flex min-h-145 items-center justify-center px-6 py-12 sm:px-12 lg:px-20"
      >
        <div className="w-full max-w-120 rise-in rise-in-delay">
          <LoginHeader />
          <LoginFields />
          <DemoAccess />
        </div>
      </section>
    </main>
  );
}

