import { NextRequest, NextResponse } from "next/server";
import { getAdminReports } from "@/lib/server/data";
import { ADMIN_ALLOWED_ROLES, AuthHttpError, requireAuthContext } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAuthContext(ADMIN_ALLOWED_ROLES);

    const range = request.nextUrl.searchParams.get("range") || "30d";
    const normalizedRange = range === "7d" || range === "30d" || range === "90d" || range === "all" ? range : "30d";

    const data = await getAdminReports(normalizedRange);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
