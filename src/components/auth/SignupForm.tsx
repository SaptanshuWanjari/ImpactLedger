"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import { FcGoogle } from "react-icons/fc";
export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/donor";

  async function completeProvision() {
    const response = await fetch("/api/auth/provision", { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Failed to complete signup.");
    }

    return payload as { homePath: string };
  }

  async function handleEmailSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (!data.session) {
        setMessage(
          "Account created. If email confirmation is enabled, verify your email then sign in.",
        );
        return;
      }

      const { homePath } = await completeProvision();
      await supabase.auth.refreshSession();
      router.replace(nextPath.startsWith("/") ? nextPath : homePath);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleSignup() {
    setPending(true);
    setMessage(null);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (error) {
      setMessage((error as Error).message);
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-muted bg-white p-8 md:p-10 space-y-6 shadow-xl ring-1 ring-black/5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">
          Secure Onboarding
        </p>
        <h1 className="text-3xl font-display font-extrabold tracking-tight">
          Create Account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign up with Google or email/password.
        </p>
      </div>

      <button
        onClick={handleGoogleSignup}
        disabled={pending}
        className="w-full rounded-xl border border-muted px-4 py-3 text-sm font-semibold hover:bg-muted/40 disabled:opacity-60"
      >
        Continue with Google
      </button>

      <form className="space-y-4" onSubmit={handleEmailSignup}>
        <input
          type="text"
          placeholder="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded-xl border border-muted px-4 py-3 text-sm"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-muted px-4 py-3 text-sm"
          required
        />
        <input
          type="password"
          placeholder="Password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-muted px-4 py-3 text-sm"
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full btn-primary py-3 disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Create Account"}
        </button>
      </form>

      {message && <p className="text-sm text-red-600">{message}</p>}

      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
          className="text-accent font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
