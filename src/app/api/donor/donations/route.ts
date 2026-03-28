import { NextRequest, NextResponse } from "next/server";
import { getRecentDonations } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const donorEmail = request.nextUrl.searchParams.get("donorEmail") || undefined;
    const limit = Number(request.nextUrl.searchParams.get("limit") || "30");
    const donations = await getRecentDonations(donorEmail, Number.isNaN(limit) ? 30 : limit);
    return NextResponse.json({ donations });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
