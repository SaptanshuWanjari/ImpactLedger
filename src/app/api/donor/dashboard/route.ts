import { NextRequest, NextResponse } from "next/server";
import { getDonorDashboard } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const donorEmail = request.nextUrl.searchParams.get("donorEmail") || undefined;
    const data = await getDonorDashboard(donorEmail);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
