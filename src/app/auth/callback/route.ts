import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AuthHttpError, ensureUserProvisioned, sanitizeNextPath } from "@/lib/server/auth";

function isStaleSessionError(error: unknown) {
  const code = typeof error === "object" && error !== null ? String((error as { code?: string }).code || "") : "";
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();
  return code === "refresh_token_not_found" || message.includes("invalid refresh token") || message.includes("refresh token not found");
}

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const nextPath = requestUrl.searchParams.get("next");

    const supabase = await createClient();

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        const loginUrl = new URL("/auth/login", requestUrl.origin);
        loginUrl.searchParams.set("error", exchangeError.message);
        return NextResponse.redirect(loginUrl);
      }
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (isStaleSessionError(error)) {
        throw new AuthHttpError(401, "Session expired. Please sign in again.");
      }
      throw new AuthHttpError(401, error.message);
    }

    if (!user) {
      throw new AuthHttpError(401, "Authentication required.");
    }

    const provisioned = await ensureUserProvisioned(user);
    await supabase.auth.refreshSession();
    const destination = sanitizeNextPath(nextPath, provisioned.homePath);

    return NextResponse.redirect(new URL(destination, requestUrl.origin));
  } catch (error) {
    const message = encodeURIComponent((error as Error).message);
    return NextResponse.redirect(new URL(`/auth/login?error=${message}`, request.url));
  }
}
