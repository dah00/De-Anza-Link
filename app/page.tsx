import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-semibold tracking-tight">DeAnza Link</h1>
      <Link href="/navigator" className={buttonVariants()}>
        Open Campus Navigator
      </Link>
    </main>
  );
}
