"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resendCode, verifyEmail } from "../actions";

export function VerifyForm({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [state, formAction, pending] = useActionState(verifyEmail, undefined);
  const [resendState, resendAction, resending] = useActionState(
    resendCode,
    undefined,
  );

  return (
    <div className="mt-6 flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Student email
          <Input
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Code
          <Input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            placeholder="123456"
            required
          />
        </label>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" size="lg" className="h-10" disabled={pending}>
          {pending ? "Checking..." : "Confirm"}
        </Button>
      </form>

      <form action={resendAction} className="flex flex-col gap-1">
        <input type="hidden" name="email" value={email} />
        <Button
          type="submit"
          variant="outline"
          size="lg"
          className="h-10"
          disabled={resending || !email}
        >
          {resending ? "Sending..." : "Send a new code"}
        </Button>
        {resendState?.error && (
          <p className="text-sm text-destructive">{resendState.error}</p>
        )}
        {resendState?.message && (
          <p className="text-sm">{resendState.message}</p>
        )}
      </form>
    </div>
  );
}
