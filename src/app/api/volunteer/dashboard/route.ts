import { NextRequest, NextResponse } from "next/server";
import { getVolunteerDashboard } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("volunteerEmail") || undefined;
    const data = await getVolunteerDashboard(email);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
