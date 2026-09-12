import { LearningIllustration } from '../LearningIllustration';
export function LoginIntro() { return (      <section className="relative flex min-h-[420px] overflow-hidden bg-[#078eac] px-8 py-10 text-white sm:px-14 lg:min-h-screen lg:px-[12%] lg:py-16">
        <div className="relative z-10 flex w-full flex-col ">
          <div className="rise-in text-[10px] font-bold uppercase tracking-[0.2em] text-[#d6f7fa]">Aprendizagem em movimento</div>
          <h1 className="rise-in mt-5 max-w-[430px] text-[clamp(2.35rem,4vw,4.1rem)] font-bold leading-[0.98] tracking-[-0.04em]">Transforme dados em decisões pedagógicas</h1>
          <p className="rise-in rise-in-delay mt-6 max-w-[365px] text-sm leading-6 text-[#d9f5f7]">Uma visão clara do desempenho de cada turma, conteúdo e estudante.</p>
          <div className="mt-auto flex justify-center pt-12 lg:justify-start lg:pt-16"><LearningIllustration /></div>
        </div>
        <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full border-[28px] border-[#43b5c4]/40" />
      </section>); }