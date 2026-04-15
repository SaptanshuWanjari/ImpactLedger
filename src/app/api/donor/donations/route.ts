import { NextRequest, NextResponse } from "next/server";
import { getRecentDonationsForCurrentUser } from "@/lib/server/data";
import { AuthHttpError } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") || "30");
    const donations = await getRecentDonationsForCurrentUser(Number.isNaN(limit) ? 30 : limit);
    return NextResponse.json({ donations });
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
