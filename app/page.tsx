import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "./(auth)/actions";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 py-8">
      <p className="text-sm font-semibold">DeAnza Link</p>
      <Suspense
        fallback={
          <p className="mt-6 text-sm text-muted-foreground">Loading...</p>
        }
      >
        <Greeting />
      </Suspense>
      <form action={logOut} className="mt-auto pt-10">
        <Button
          type="submit"
          variant="outline"
          size="lg"
          className="h-10 w-full"
        >
          Log out
        </Button>
      </form>
    </main>
  );
}

async function Greeting() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name, interests")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div className="mt-6">
      <h1 className="text-2xl font-semibold">
        Hey{profile?.display_name ? `, ${profile.display_name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your activities and suggestions will show up here.
      </p>
      {profile?.interests?.length ? (
        <p className="mt-4 text-sm">Into: {profile.interests.join(", ")}</p>
      ) : null}
    </div>
  );
}
