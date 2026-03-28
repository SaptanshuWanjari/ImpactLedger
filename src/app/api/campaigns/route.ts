import { NextResponse } from "next/server";
import { getCampaigns } from "@/lib/server/data";

export async function GET() {
  try {
    const data = await getCampaigns();
    return NextResponse.json({ campaigns: data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
