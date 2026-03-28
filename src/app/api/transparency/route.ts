import { NextRequest, NextResponse } from "next/server";
import { getTransparencyLedger } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") || "20");
    const ledger = await getTransparencyLedger(Number.isNaN(limit) ? 20 : limit);
    return NextResponse.json({ ledger });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
