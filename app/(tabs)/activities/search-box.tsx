"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pushed, setPushed] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (initial !== prevInitial) {
    setPrevInitial(initial);
    if (initial !== pushed) {
      setValue(initial);
      setPushed(initial);
    }
  }

  useEffect(() => {
    const q = value.trim();
    if (q === initial) return;
    const timer = setTimeout(() => {
      setPushed(q);
      startTransition(() => {
        router.replace(
          q ? `/activities?q=${encodeURIComponent(q)}` : "/activities",
          { scroll: false },
        );
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [value, initial, router]);

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()}>
      <label className="relative block">
        <span className="sr-only">Search activities</span>
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground",
            pending && "animate-pulse",
          )}
        />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search, e.g. pickleball, boba, library"
          enterKeyHint="search"
          className="h-10 w-full rounded-md border border-input bg-card pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-foreground/40"
        />
      </label>
    </form>
  );
}
