import logoImage from "@/assets/images/LogoImage.png";
import Image from "next/image";

export function LoginHeader({ title = "Bem-vindo de volta!", description = "Informe seus dados para continuar" }: { title?: string; description?: string }) {
  return (
    <div className="mb-16 text-center">
      <Image
        src={logoImage}
        alt="Pulso Escolar"
        preload
        sizes="(max-width: 380px) calc(100vw - 48px), 320px"
        className="mx-auto mb-8 h-auto w-full max-w-[320px]"
      />
      <h2 className="text-2xl font-bold text-[#078eac]">{title}</h2>
      <p className="mt-2 text-sm text-(--muted)">{description}</p>
    </div>
  );
}
