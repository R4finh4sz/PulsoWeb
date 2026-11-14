import logoImage from "@/assets/images/LogoImage.png";
import Image from "next/image";

export function LoginHeader({
  title = "Bem-vindo de volta!",
  description = "Informe seus dados para continuar",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mb-10 text-center">
      <Image
        src={logoImage}
        alt="Pulso Escolar"
        preload
        sizes="(max-width: 380px) calc(100vw - 48px), 320px"
        className="mx-auto mb-8 h-auto w-full max-w-[320px]"
      />
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-(--muted)">{description}</p>
    </div>
  );
}
