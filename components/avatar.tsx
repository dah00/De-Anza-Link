"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function Avatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl: string | null;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-medium text-primary",
        className,
      )}
      title={name}
    >
      {photoUrl && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- photos come from Supabase Storage and seed URLs, not configured for next/image
        <img
          src={photoUrl}
          alt={name}
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
