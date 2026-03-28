import { NextResponse } from "next/server";
import { getAdminDashboard } from "@/lib/server/data";

export async function GET() {
  try {
    const data = await getAdminDashboard();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
