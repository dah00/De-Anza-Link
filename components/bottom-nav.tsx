"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Compass,
  House,
  MessagesSquare,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/activities", label: "Activities", icon: CalendarDays },
  { href: "/chats", label: "Chats", icon: MessagesSquare },
  { href: "/resources", label: "Resources", icon: Compass },
  { href: "/account", label: "Account", icon: UserRound },
] as const;

export function BottomNav({ unreadChats }: { unreadChats: boolean }) {
  return (
    <Suspense fallback={<NavBar pathname={null} unreadChats={unreadChats} />}>
      <ActiveNavBar unreadChats={unreadChats} />
    </Suspense>
  );
}

function ActiveNavBar({ unreadChats }: { unreadChats: boolean }) {
  return <NavBar pathname={usePathname()} unreadChats={unreadChats} />;
}

function NavBar({
  pathname,
  unreadChats,
}: {
  pathname: string | null;
  unreadChats: boolean;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-md grid-cols-5">
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
              <span className="relative">
                <Icon className="size-5" />
                {href === "/chats" && unreadChats && (
                  <span className="absolute -top-0.5 -right-1 size-2.5 rounded-full border-2 border-card bg-primary">
                    <span className="sr-only">New messages</span>
                  </span>
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
