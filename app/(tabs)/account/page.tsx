import { Suspense } from "react";
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
    <AccountForm
      email={user.email ?? ""}
      photoUrl={profile?.photo_url ?? null}
      initial={{
        displayName: profile?.display_name ?? "",
        major: profile?.major ?? "",
        bio: profile?.bio ?? "",
        interests: profile?.interests ?? [],
      }}
    />
  );
}
