import type { Metadata } from "next";

import { NavigatorChat } from "@/components/navigator/navigator-chat";

export const metadata: Metadata = {
  title: "Campus Navigator | DeAnza Link",
  description: "Find De Anza resources, events, and campus contacts.",
};

export default function NavigatorPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground">DeAnza Link</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Campus Navigator
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Ask a campus question in your own words. We’ll point you to De Anza
          resources.
        </p>
      </div>
      <div className="mt-8">
        <NavigatorChat />
      </div>
    </main>
  );
}
