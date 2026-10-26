import Link from "next/link";

export function LoginAction() {
  return (
    <Link href="/forgot-password" className="mt-2 block ml-auto w-fit text-xs font-normal text-(--blue)">
      Esqueci minha senha
    </Link>
  );
}
