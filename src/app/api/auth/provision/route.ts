import { NextResponse } from "next/server";
import { ensureUserProvisioned, AuthHttpError, sanitizeNextPath } from "@/lib/server/auth";
import { createClient } from "@/lib/supabase/server";

function isStaleSessionError(error: unknown) {
  const code = typeof error === "object" && error !== null ? String((error as { code?: string }).code || "") : "";
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();
  return code === "refresh_token_not_found" || message.includes("invalid refresh token") || message.includes("refresh token not found");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
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

    const body = await request.json().catch(() => ({}));
    const nextPath = typeof body?.next === "string" ? body.next : null;

    const provisioned = await ensureUserProvisioned(user);
    const redirectPath = sanitizeNextPath(nextPath, provisioned.homePath);

    return NextResponse.json({
      role: provisioned.role,
      homePath: provisioned.homePath,
      redirectPath,
    });
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
