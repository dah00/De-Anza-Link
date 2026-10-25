import { cookies } from "next/headers";

// Remembers who is confirming, so /verify can prefill the email without
// putting it in the URL. Set by the sign-up, log-in, and resend actions.
export const PENDING_EMAIL_COOKIE = "pending_email";

export async function getPendingEmail() {
  return (await cookies()).get(PENDING_EMAIL_COOKIE)?.value ?? "";
}
