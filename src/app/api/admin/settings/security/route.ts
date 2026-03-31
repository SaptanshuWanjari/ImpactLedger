import { NextResponse } from "next/server";
import { getAdminSettingsSecurity } from "@/lib/server/data";
import { AuthHttpError } from "@/lib/server/auth";

export async function GET() {
  try {
    const data = await getAdminSettingsSecurity();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
