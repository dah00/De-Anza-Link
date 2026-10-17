"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string; message?: string } | undefined;

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const is18Plus = formData.get("is18Plus") === "on";

  if (!email || !password) return { error: "Enter your email and a password." };
  if (password.length < 6) {
    return { error: "Password needs to be at least 6 characters." };
  }
  if (!is18Plus) return { error: "You need to be 18 or older to join." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { is_18_plus: true } },
  });

  if (error) return { error: signUpErrorMessage(error.code, error.message) };
  if (!data.session) {
    return {
      message: "Check your email to confirm your account, then log in.",
    };
  }

  redirect("/onboarding");
}

function signUpErrorMessage(code: string | undefined, fallback: string) {
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "There's already an account with that email. Try logging in.";
    case "email_address_invalid":
      return "That email doesn't look right. Try a different one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many sign-ups in a row. Wait a minute and try again.";
    case "weak_password":
      return "Pick a stronger password.";
    default:
      return fallback;
  }
}

export async function logIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "That email and password don't match." };

  redirect("/");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
