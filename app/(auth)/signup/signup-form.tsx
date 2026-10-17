"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp } from "../actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <Input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
        <span className="text-xs font-normal text-muted-foreground">
          At least 6 characters.
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          name="is18Plus"
          type="checkbox"
          required
          className="mt-0.5 size-4 accent-foreground"
        />
        I&apos;m 18 or older.
      </label>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      {state?.message && <p className="text-sm">{state.message}</p>}

      <Button type="submit" size="lg" className="h-10" disabled={pending}>
        {pending ? "Creating account..." : "Sign up"}
      </Button>
    </form>
  );
}
