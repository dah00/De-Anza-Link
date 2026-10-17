"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INTEREST_GROUPS } from "@/lib/interests";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { completeOnboarding, type OnboardingData } from "./actions";

const STEPS = ["Interests", "Photo", "About you"] as const;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function OnboardingFlow({
  userId,
  initial,
}: {
  userId: string;
  initial: OnboardingData;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<OnboardingData>) => {
    setError(null);
    setData((d) => ({ ...d, ...patch }));
  };
  const next = () => {
    setError(null);
    setStep((s) => s + 1);
  };
  const back = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{STEPS[step]}</span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
        >
          <div
            className="h-full rounded-full bg-foreground transition-[width] duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-1 flex-col">
        {step === 0 && (
          <InterestsStep
            selected={data.interests}
            onChange={(interests) => update({ interests })}
            onNext={next}
          />
        )}
        {step === 1 && (
          <PhotoStep
            userId={userId}
            photoUrl={data.photoUrl}
            onUploaded={(photoUrl) => update({ photoUrl })}
            onBack={back}
            onNext={next}
            error={error}
            setError={setError}
          />
        )}
        {step === 2 && (
          <AboutStep
            data={data}
            onChange={update}
            onBack={back}
            error={error}
            setError={setError}
          />
        )}
      </div>
    </div>
  );
}

function InterestsStep({
  selected,
  onChange,
  onNext,
}: {
  selected: string[];
  onChange: (interests: string[]) => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const toggle = (interest: string) =>
    onChange(
      selected.includes(interest)
        ? selected.filter((i) => i !== interest)
        : [...selected, interest],
    );

  const groups = INTEREST_GROUPS.map((group) => ({
    label: group.label,
    interests: group.interests.filter((i) => i.toLowerCase().includes(q)),
  })).filter((group) => group.interests.length > 0);

  return (
    <>
      <h1 className="text-2xl font-semibold">What are you into?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a few. We&apos;ll use these to suggest activities.
      </p>

      <div className="sticky top-0 z-10 -mx-5 mt-5 bg-background px-5 pt-1 pb-3">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search, e.g. soccer, psych, boba"
          aria-label="Search interests"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {selected.length === 0
            ? "Nothing picked yet"
            : `${selected.length} picked: ${selected.join(", ")}`}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <section key={group.label}>
            <h2 className="mb-2 text-sm font-medium text-muted-foreground">
              {group.label}
            </h2>
            <div className="flex flex-wrap gap-2">
              {group.interests.map((interest) => {
                const on = selected.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggle(interest)}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                      on
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background hover:border-foreground/40",
                    )}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No match for &ldquo;{query.trim()}&rdquo;. Try another word, or pick
            something close from the list.
          </p>
        )}
      </div>

      <StepFooter>
        <Button
          size="lg"
          className="h-10 flex-1"
          disabled={selected.length === 0}
          onClick={onNext}
        >
          Next
        </Button>
      </StepFooter>
    </>
  );
}

function PhotoStep({
  userId,
  photoUrl,
  onUploaded,
  onBack,
  onNext,
  error,
  setError,
}: {
  userId: string;
  photoUrl: string | null;
  onUploaded: (url: string) => void;
  onBack: () => void;
  onNext: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pick = (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      setError("That file isn't an image.");
      return;
    }
    if (picked.size > MAX_PHOTO_BYTES) {
      setError("That photo is over 5 MB. Try a smaller one.");
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const uploadAndContinue = async () => {
    if (!file) return onNext();
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type });
    setUploading(false);

    if (uploadError) {
      setError("Upload didn't work. Try again or skip for now.");
      return;
    }
    onUploaded(
      supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl,
    );
    onNext();
  };

  const shown = preview ?? photoUrl;

  return (
    <>
      <h1 className="text-2xl font-semibold">Add a photo</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Helps people spot you when you meet up.
      </p>

      <label className="mt-8 flex cursor-pointer flex-col items-center gap-3">
        <div className="flex size-32 items-center justify-center overflow-hidden rounded-full border border-dashed border-foreground/30 bg-muted text-sm text-muted-foreground">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob: preview URLs aren't supported by next/image
            <img
              src={shown}
              alt="Your photo"
              className="size-full object-cover"
            />
          ) : (
            "No photo"
          )}
        </div>
        <span className="text-sm font-medium underline">
          {shown ? "Choose a different photo" : "Choose a photo"}
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </label>

      {error && (
        <p className="mt-4 text-center text-sm text-destructive">{error}</p>
      )}

      <StepFooter>
        <Button variant="outline" size="lg" className="h-10" onClick={onBack}>
          Back
        </Button>
        <Button
          size="lg"
          className="h-10 flex-1"
          disabled={uploading}
          onClick={uploadAndContinue}
        >
          {uploading ? "Uploading..." : shown ? "Next" : "Skip for now"}
        </Button>
      </StepFooter>
    </>
  );
}

function AboutStep({
  data,
  onChange,
  onBack,
  error,
  setError,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  error: string | null;
  setError: (error: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await completeOnboarding(data);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col">
      <h1 className="text-2xl font-semibold">A bit about you</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This is what others see when you join something.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Name
          <Input
            value={data.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
            placeholder="What should people call you?"
            maxLength={40}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Major
          <Input
            value={data.major}
            onChange={(e) => onChange({ major: e.target.value })}
            placeholder="e.g. Psychology, Undeclared"
            maxLength={60}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Short bio{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
          <textarea
            value={data.bio}
            onChange={(e) => onChange({ bio: e.target.value })}
            placeholder="Transfer student, always down for boba."
            maxLength={160}
            rows={3}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-foreground/40"
          />
          <span className="text-right text-xs font-normal text-muted-foreground">
            {data.bio.length}/160
          </span>
        </label>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <StepFooter>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-10"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="h-10 flex-1"
          disabled={pending}
        >
          {pending ? "Saving..." : "Finish"}
        </Button>
      </StepFooter>
    </form>
  );
}

function StepFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-auto flex gap-2 bg-background px-5 pt-6 pb-4">
      {children}
    </div>
  );
}
