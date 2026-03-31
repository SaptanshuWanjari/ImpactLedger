import { NextResponse } from "next/server";
import { getAdminSettingsIntegrations } from "@/lib/server/data";
import { AuthHttpError } from "@/lib/server/auth";

export async function GET() {
  try {
    const data = await getAdminSettingsIntegrations();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
