"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, MessageCircle, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/activities", label: "Activities", icon: CalendarDays },
  { href: "/resources", label: "Resources", icon: MessageCircle },
  { href: "/account", label: "Account", icon: UserRound },
] as const;

export function BottomNav() {
  return (
    <Suspense fallback={<NavBar pathname={null} />}>
      <ActiveNavBar />
    </Suspense>
  );
}

function ActiveNavBar() {
  return <NavBar pathname={usePathname()} />;
}

function NavBar({ pathname }: { pathname: string | null }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname !== null &&
            (href === "/" ? pathname === "/" : pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-xs",
                active ? "font-medium text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
