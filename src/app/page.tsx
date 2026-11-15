import loginImage from "@/assets/images/LoginImage.png";
import logoWhite from "@/assets/images/LogoImageWhite.png";
import { ContactForm } from "@/components/screens/Landing/ContactForm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pulso Escolar | Para escolas",
  description:
    "Conheça o Pulso Escolar: acompanhe o desempenho de turmas, conteúdos e estudantes e transforme dados em decisões pedagógicas.",
};

const features = [
  {
    title: "Visão clara por turma",
    text: "Acompanhe o desempenho de cada turma, disciplina e estudante em painéis simples de ler.",
  },
  {
    title: "Atividades e conteúdos",
    text: "Professores criam atividades, organizam o conteúdo programático e veem o que a turma já domina.",
  },
  {
    title: "Relatórios e ranking",
    text: "Métricas e relatórios para a coordenação apoiarem decisões pedagógicas com dados.",
  },
  {
    title: "Perfis para cada papel",
    text: "Administrador, coordenador, professor e aluno, cada um com o acesso que precisa.",
  },
  {
    title: "Convites e cadastro simples",
    text: "Professores e alunos entram por convite, com aprovação da coordenação da escola.",
  },
  {
    title: "Privacidade e LGPD",
    text: "Termos de uso, política de privacidade e consentimento de responsáveis registrados na plataforma.",
  },
];

const steps = [
  { n: "1", title: "Fale com a gente", text: "Envie o formulário abaixo com os dados da escola." },
  { n: "2", title: "Cadastramos a escola", text: "Criamos a escola e o acesso da coordenação." },
  { n: "3", title: "Convide a equipe", text: "A coordenação convida professores e organiza as turmas." },
  { n: "4", title: "Acompanhe o pulso", text: "Veja o desempenho da aprendizagem de cada turma." },
];

export default function SchoolsLanding() {
  return (
    <div className="min-h-screen">

      <div className="bg-[#078eac] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <Image src={logoWhite} alt="Pulso Escolar" preload className="h-auto w-36 sm:w-44" />
        <nav className="flex items-center gap-4 text-sm font-medium">
          <a href="#contato" className="hidden text-white hover:underline sm:inline">
            Fale conosco
          </a>
          <Link
            href="/login"
            className="rounded-xl border border-white/70 px-4 py-2 text-white transition-colors hover:bg-white hover:text-(--blue-dark)"
          >
            Entrar
          </Link>
        </nav>
      </header>
        <section>
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-14 pt-6 lg:grid-cols-2 lg:pb-20 lg:pt-10">
            <div className="rise-in">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d6f7fa]">
                Para escolas · Aprendizagem em movimento
              </p>
              <h1 className="mt-5 text-[clamp(2.2rem,4.5vw,3.75rem)] font-bold leading-[1.02] tracking-[-0.04em]">
                Transforme dados em decisões pedagógicas
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#d9f5f7]">
                O Pulso Escolar dá à sua escola uma visão clara do desempenho de cada turma, conteúdo e
                estudante, para agir antes que as dificuldades cresçam.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#contato"
                  className="rounded-xl bg-[#e3c600] px-6 py-3 text-sm font-semibold text-(--ink) transition-colors hover:bg-[#f0d511]"
                >
                  Quero levar para minha escola
                </a>
                <a
                  href="#recursos"
                  className="rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Conhecer recursos
                </a>
              </div>
            </div>
            <Image
              src={loginImage}
              alt=""
              loading="eager"
              sizes="(max-width: 1024px) 90vw, 560px"
              className="mx-auto h-auto w-full max-w-140"
            />
          </div>
        </section>
      </div>

      <main>
        <section id="recursos" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-16 lg:py-20">
          <h2 className="page-title max-w-2xl">Tudo o que a escola precisa para acompanhar a aprendizagem</h2>
          <p className="page-description mt-3">Uma única plataforma para coordenação, professores e alunos.</p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <li key={f.title} className="rounded-2xl border border-[#cfe7ee] bg-[#f3fafc] p-6">
                <span aria-hidden className="mb-4 block h-1.5 w-10 rounded-full bg-(--blue)" />
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-(--muted)">{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-[#e6f4f8]">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <h2 className="page-title">Como começar</h2>
            <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <li key={s.n} className="rounded-2xl bg-white p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-(--blue-dark) text-sm font-bold text-white">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-(--muted)">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="contato" className="mx-auto max-w-3xl scroll-mt-6 px-6 py-16 lg:py-20">
          <div className="text-center">
            <h2 className="page-title">Vamos levar o Pulso Escolar para sua escola?</h2>
            <p className="page-description mx-auto mt-3">
              Preencha os dados abaixo e envie um e-mail para nossa equipe. Respondemos para combinar uma
              apresentação.
            </p>
          </div>
          <div className="mt-10 rounded-2xl border border-(--line) bg-white p-6 sm:p-8">
            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="bg-[#078eac] px-6 py-8 text-center text-sm text-[#d9f5f7]">
        © {new Date().getFullYear()} Pulso Escolar. Todos os direitos reservados.
      </footer>
    </div>
  );
}
