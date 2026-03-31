import { NextResponse } from "next/server";
import { getVolunteerImpactLogsForCurrentUser } from "@/lib/server/data";
import { AuthHttpError, requireAuthContext } from "@/lib/server/auth";

export async function GET() {
  try {
    await requireAuthContext(["volunteer", "org_admin"]);
    const data = await getVolunteerImpactLogsForCurrentUser();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
