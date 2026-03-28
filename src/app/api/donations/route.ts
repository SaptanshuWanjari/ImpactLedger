import { NextRequest, NextResponse } from "next/server";
import { createDonation, getRecentDonations } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  try {
    const donorEmail = request.nextUrl.searchParams.get("donorEmail") || undefined;
    const limit = Number(request.nextUrl.searchParams.get("limit") || "20");
    const data = await getRecentDonations(donorEmail, Number.isNaN(limit) ? 20 : limit);
    return NextResponse.json({ donations: data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const amount = Number(body.amount || 0);

    if (!body.fullName || !body.email || amount <= 0) {
      return NextResponse.json(
        { error: "fullName, email, and a positive amount are required." },
        { status: 400 },
      );
    }

    const donation = await createDonation({
      fullName: body.fullName,
      email: body.email,
      amount,
      campaignId: body.campaignId,
      isAnonymous: body.isAnonymous,
      paymentMethod: body.paymentMethod,
    });

    return NextResponse.json({ donation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
