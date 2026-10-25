import { Suspense } from "react";
import Link from "next/link";
import { getPendingEmail } from "../pending-email";
import { VerifyForm } from "./verify-form";

export default function VerifyPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Check your email</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We sent a code to your student email. Enter it here to finish signing
        up. It can take a minute, and sometimes lands in spam.
      </p>
      <Suspense
        fallback={
          <div className="mt-6 h-56 animate-pulse rounded-lg bg-muted" />
        }
      >
        <PrefilledForm />
      </Suspense>
      <p className="mt-6 text-sm text-muted-foreground">
        Already confirmed?{" "}
        <Link href="/login" className="font-medium text-foreground underline">
          Log in
        </Link>
      </p>
    </>
  );
}

async function PrefilledForm() {
  return <VerifyForm defaultEmail={await getPendingEmail()} />;
}
