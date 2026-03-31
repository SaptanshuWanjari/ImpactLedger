import { NextResponse } from "next/server";
import { getAdminCampaigns } from "@/lib/server/data";
import { ADMIN_ALLOWED_ROLES, AuthHttpError, requireAuthContext } from "@/lib/server/auth";

export async function GET() {
  try {
    await requireAuthContext(ADMIN_ALLOWED_ROLES);
    const campaigns = await getAdminCampaigns();
    return NextResponse.json({ campaigns });
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
