import { NextResponse } from "next/server";
import { getVolunteerVerificationForCurrentUser } from "@/lib/server/data";
import { AuthHttpError, requireAuthContext } from "@/lib/server/auth";

export async function GET() {
  try {
    await requireAuthContext(["volunteer", "org_admin"]);
    const data = await getVolunteerVerificationForCurrentUser();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
