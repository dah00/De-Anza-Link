import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { ChatUpdates } from "@/components/chat-updates";
import { hasUnreadChats } from "@/lib/chat";
import { createClient } from "@/lib/supabase/server";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6 pb-24">
        {children}
      </div>
      <Suspense fallback={<BottomNav unreadChats={false} />}>
        <NavWithUnread />
      </Suspense>
      <ChatUpdates />
    </>
  );
}

async function NavWithUnread() {
  const supabase = await createClient();
  return <BottomNav unreadChats={await hasUnreadChats(supabase)} />;
}
