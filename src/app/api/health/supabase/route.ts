import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "lions-global";

function isTimeoutError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();
  const causeCode =
    typeof error === "object" && error !== null
      ? String(((error as { cause?: { code?: string } }).cause?.code as string) || "")
      : "";

  return message.includes("fetch failed") || message.includes("connect timeout") || causeCode === "UND_ERR_CONNECT_TIMEOUT";
}

export async function GET() {
  const startedAt = Date.now();

  try {
    const supabase = createAdminClient() as any;
    const { data, error } = await supabase
      .from("tenants")
      .select("id,slug")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        ok: true,
        service: "supabase",
        tenantSlug: DEFAULT_TENANT_SLUG,
        tenantFound: Boolean(data?.id),
        latencyMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    const timeout = isTimeoutError(error);
    return NextResponse.json(
      {
        ok: false,
        service: "supabase",
        tenantSlug: DEFAULT_TENANT_SLUG,
        latencyMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        code:
          typeof error === "object" && error !== null
            ? String((error as { code?: string }).code || (error as { cause?: { code?: string } }).cause?.code || "")
            : "",
      },
      { status: timeout ? 503 : 500 },
    );
  }
}

