import Image from "next/image";
import loginImage from "@/assets/images/LoginImage.png";

export function LearningIllustration() {
  return (
    <Image
      src={loginImage}
      alt=""
      sizes="(max-width: 424px) calc(100vw - 64px), 500px"
      className="h-auto w-full max-w-[500px] object-contain"
    />
  );
}
