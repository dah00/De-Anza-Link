import { BottomNav } from "@/components/bottom-nav";

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
      <BottomNav />
    </>
  );
}
