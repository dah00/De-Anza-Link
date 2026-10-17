import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "./onboarding-flow";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 py-8">
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading...</p>}
      >
        <OnboardingLoader />
      </Suspense>
    </main>
  );
}

async function OnboardingLoader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, major, bio, photo_url, interests")
    .eq("id", user.id)
    .single();

  return (
    <OnboardingFlow
      userId={user.id}
      initial={{
        interests: profile?.interests ?? [],
        photoUrl: profile?.photo_url ?? null,
        displayName: profile?.display_name ?? "",
        major: profile?.major ?? "",
        bio: profile?.bio ?? "",
      }}
    />
  );
}
