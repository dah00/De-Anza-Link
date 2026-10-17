import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "./account-form";

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" />}>
      <AccountLoader />
    </Suspense>
  );
}

async function AccountLoader() {
  noStore();
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

  const initial = {
    displayName: profile?.display_name ?? "",
    major: profile?.major ?? "",
    bio: profile?.bio ?? "",
    interests: profile?.interests ?? [],
  };

  return (
    <AccountForm
      key={user.id}
      email={user.email ?? ""}
      photoUrl={profile?.photo_url ?? null}
      initial={initial}
    />
  );
}
