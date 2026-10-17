import { NavigatorChat } from "@/components/navigator/navigator-chat";

export default function ResourcesPage() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Resources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask about De Anza — food, bikes, computers, and other campus stuff.
        </p>
      </header>
      <NavigatorChat />
    </div>
  );
}
