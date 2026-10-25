"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isStudentEmail } from "@/lib/student-email";
import { PENDING_EMAIL_COOKIE } from "./pending-email";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string; message?: string } | undefined;

async function rememberPendingEmail(email: string) {
  (await cookies()).set(PENDING_EMAIL_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const is18Plus = formData.get("is18Plus") === "on";

  if (!email || !password) return { error: "Enter your email and a password." };
  if (!isStudentEmail(email)) {
    return {
      error: "Use your De Anza student email (@deanza.edu or @fhda.edu).",
    };
  }
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

  // With email confirmation on, there's no session until they enter the code.
  if (!data.session) {
    await rememberPendingEmail(email);
    redirect("/verify");
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

  if (error?.code === "email_not_confirmed") {
    await rememberPendingEmail(email);
    redirect("/verify");
  }
  if (error) return { error: "That email and password don't match." };

  redirect("/");
}

export async function verifyEmail(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");

  if (!email) return { error: "Enter the email you signed up with." };
  if (!/^\d{6,10}$/.test(code)) {
    return { error: "Enter the code from the email. It's all numbers." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error) {
    return {
      error:
        error.code === "otp_expired"
          ? "That code expired or is wrong. Send a new one."
          : "That code didn't work. Check it and try again.",
    };
  }

  (await cookies()).delete(PENDING_EMAIL_COOKIE);
  redirect("/onboarding");
}

export async function resendCode(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter the email you signed up with." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });

  if (error) {
    return {
      error:
        error.code === "over_email_send_rate_limit" ||
        error.code === "over_request_rate_limit"
          ? "Wait a minute before asking for another code."
          : "Couldn't send a new code. Try again in a minute.",
    };
  }

  await rememberPendingEmail(email);
  return { message: "Sent a new code. Check your inbox and spam folder." };
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
