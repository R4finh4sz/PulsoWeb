"use client";

import { profileApi } from "@/integrations/profile/api";
import type { SessionUser } from "@/interfaces/auth";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export function UserAvatar({ user, className }: { user: SessionUser; className: string }) {
  const image = useRef<HTMLImageElement>(null);
  const photo = useQuery({
    queryKey: ["profile-photo", user.id],
    queryFn: async ({ signal }) => (await profileApi.photo(signal)) ?? null,
    retry: false,
  });
  useEffect(() => {
    if (!photo.data || !image.current) return;
    const url = URL.createObjectURL(photo.data);
    image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [photo.data]);
  if (photo.data)
    // eslint-disable-next-line @next/next/no-img-element
    return <img ref={image} alt="Foto de perfil" className={`${className} object-cover`} />;
  return (
    <span aria-hidden="true" className={className}>
      {user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}
    </span>
  );
}
