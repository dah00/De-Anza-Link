"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INTEREST_GROUPS } from "@/lib/interests";
import { cn } from "@/lib/utils";
import { logOut } from "../../(auth)/actions";
import { updateProfile, type ProfileData } from "./actions";

export function AccountForm({
  email,
  photoUrl,
  initial,
}: {
  email: string;
  photoUrl: string | null;
  initial: ProfileData;
}) {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState<
    { kind: "saved" } | { kind: "error"; message: string } | null
  >(null);
  const [pending, startTransition] = useTransition();

  const update = (patch: Partial<ProfileData>) => {
    setStatus(null);
    setData((d) => ({ ...d, ...patch }));
  };

  const toggleInterest = (interest: string) =>
    update({
      interests: data.interests.includes(interest)
        ? data.interests.filter((i) => i !== interest)
        : [...data.interests, interest],
    });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateProfile(data);
      setStatus(
        result?.error
          ? { kind: "error", message: result.error }
          : { kind: "saved" },
      );
    });
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form onSubmit={save} className="flex flex-col gap-6">
        <section className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={data.displayName || email}
              photoUrl={photoUrl}
              className="size-14 text-base"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {data.displayName || "No name yet"}
              </p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Name
              <Input
                value={data.displayName}
                onChange={(e) => update({ displayName: e.target.value })}
                placeholder="What should people call you?"
                maxLength={40}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Major
              <Input
                value={data.major}
                onChange={(e) => update({ major: e.target.value })}
                placeholder="e.g. Psychology, Undeclared"
                maxLength={60}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              <span>
                Short bio{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </span>
              <textarea
                value={data.bio}
                onChange={(e) => update({ bio: e.target.value })}
                placeholder="Tell students about yourself..."
                maxLength={160}
                rows={3}
                className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-foreground/40"
              />
              <span className="text-right text-xs font-normal text-muted-foreground">
                {data.bio.length}/160
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Your interests</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            We use these to suggest activities on Home.
          </p>
          <div className="mt-4 flex flex-col gap-5">
            {INTEREST_GROUPS.map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  {group.label}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.interests.map((interest) => {
                    const on = data.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        aria-pressed={on}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="sticky bottom-20 flex flex-col gap-2">
          {status?.kind === "error" && (
            <p className="text-sm text-destructive">{status.message}</p>
          )}
          {status?.kind === "saved" && (
            <p role="status" className="text-sm text-primary">
              Saved.
            </p>
          )}
          <Button type="submit" size="lg" className="h-11" disabled={pending}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>

      <form action={logOut}>
        <Button
          type="submit"
          variant="outline"
          size="lg"
          className="h-11 w-full"
        >
          Log out
        </Button>
      </form>
    </div>
  );
}
