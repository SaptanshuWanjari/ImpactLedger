import { NextRequest, NextResponse } from "next/server";
import { createFieldReportForCurrentUser, getVolunteerDashboardForCurrentUser } from "@/lib/server/data";
import { AuthHttpError, requireAuthContext } from "@/lib/server/auth";

export async function GET() {
  try {
    await requireAuthContext(["volunteer", "org_admin"]);
    const data = await getVolunteerDashboardForCurrentUser();
    return NextResponse.json({ assignments: data.assignments });
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthContext(["volunteer", "org_admin"]);
    const body = await request.json();
    const report = await createFieldReportForCurrentUser({
      assignmentId: body.assignmentId,
      impactMetric: body.impactMetric ? Number(body.impactMetric) : undefined,
      notes: body.notes,
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
