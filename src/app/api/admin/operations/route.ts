import { NextRequest, NextResponse } from "next/server";
import { createExpense, getOperations } from "@/lib/server/data";
import { ADMIN_ALLOWED_ROLES, AuthHttpError, requireAuthContext } from "@/lib/server/auth";

export async function GET() {
  try {
    await requireAuthContext(ADMIN_ALLOWED_ROLES);
    const operations = await getOperations();
    return NextResponse.json({ operations });
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthContext(ADMIN_ALLOWED_ROLES);
    const body = await request.json();

    if (!body.category || !body.amount) {
      return NextResponse.json({ error: "category and amount are required" }, { status: 400 });
    }

    const expense = await createExpense({
      campaignId: body.campaignId,
      category: body.category,
      amount: Number(body.amount),
      notes: body.notes,
      vendor: body.vendor,
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
