import { NextRequest, NextResponse } from "next/server";
import { createFieldReport, getVolunteerDashboard } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("volunteerEmail") || undefined;
    const data = await getVolunteerDashboard(email);
    return NextResponse.json({ assignments: data.assignments });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const report = await createFieldReport({
      assignmentId: body.assignmentId,
      volunteerEmail: body.volunteerEmail,
      impactMetric: body.impactMetric ? Number(body.impactMetric) : undefined,
      notes: body.notes,
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
