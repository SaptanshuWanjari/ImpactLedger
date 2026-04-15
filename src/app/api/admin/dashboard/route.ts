import { NextResponse } from "next/server";
import { getAdminDashboard } from "@/lib/server/data";
import { ADMIN_ALLOWED_ROLES, AuthHttpError, requireAuthContext } from "@/lib/server/auth";

export async function GET() {
  try {
    await requireAuthContext(ADMIN_ALLOWED_ROLES);
    const data = await getAdminDashboard();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = (error as Error).message || "Dashboard data unavailable.";
    const lowered = message.toLowerCase();
    const isServiceIssue =
      lowered.includes("fetch failed") ||
      lowered.includes("connect timeout") ||
      lowered.includes("permission denied");

    return NextResponse.json({ error: message }, { status: isServiceIssue ? 503 : 500 });
  }
}
