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
    let authUser = null;

    if (code) {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        const loginUrl = new URL("/auth/login", requestUrl.origin);
        loginUrl.searchParams.set("error", exchangeError.message);
        return NextResponse.redirect(loginUrl);
      }
      authUser = data.user;
    }

    if (!authUser) {
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
      authUser = user;
    }

    if (!authUser) {
      throw new AuthHttpError(401, "Authentication required.");
    }

    const provisioned = await ensureUserProvisioned(authUser);
    
    // Only refresh session if we didn't just get it from an exchange,
    // OR if ensureUserProvisioned actually updated the user's role metadata.
    // However, to be safe and ensure claims are synced, we refresh.
    // To optimize further, ensureUserProvisioned could return a flag `metadataUpdated`.
    if (provisioned.metadataUpdated) {
        await supabase.auth.refreshSession();
    } else if (!code) {
        // Just refresh if it was an existing session to ensure it's valid
        await supabase.auth.refreshSession();
    }

    const destination = sanitizeNextPath(nextPath, provisioned.homePath);

    return NextResponse.redirect(new URL(destination, requestUrl.origin));
  } catch (error) {
    const message = encodeURIComponent((error as Error).message);
    return NextResponse.redirect(new URL(`/auth/login?error=${message}`, request.url));
  }
}

