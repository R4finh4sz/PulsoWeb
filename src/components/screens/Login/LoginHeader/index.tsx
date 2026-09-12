import Image from "next/image";
import logoImage from "@/assets/images/LogoImage.png";

export function LoginHeader() {
  return (
    <div className="mb-16 text-center">
      <Image
        src={logoImage}
        alt="Pulso Escolar"
        preload
        sizes="(max-width: 380px) calc(100vw - 48px), 320px"
        className="mx-auto mb-8 h-auto w-full max-w-[320px]"
      />
      <h2 className="text-2xl font-bold text-[#078eac]">Bem-vindo de volta!</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Informe seus dados para continuar
      </p>
    </div>
  );
}
