import { NextResponse } from "next/server";
import { getCampaigns } from "@/lib/server/data";

export async function GET() {
  try {
    const data = await getCampaigns();
    return NextResponse.json({ campaigns: data });
  } catch (error) {
    const message = (error as Error).message;
    const isConfigOrAccessIssue =
      message.toLowerCase().includes("unable to resolve tenant") ||
      message.toLowerCase().includes("permission denied") ||
      message.toLowerCase().includes("missing");

    return NextResponse.json({ error: message }, { status: isConfigOrAccessIssue ? 503 : 500 });
  }
}
