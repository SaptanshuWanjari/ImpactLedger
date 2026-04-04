import { NextRequest, NextResponse } from "next/server";
import { dispatchDonationInvoice } from "@/lib/server/invoice";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Donation id is required." }, { status: 400 });
    }

    const invoice = await dispatchDonationInvoice({
      donationId: id,
      origin: request.nextUrl.origin,
    });

    const statusCode = invoice.status === "failed" ? 500 : 200;
    return NextResponse.json({ invoice }, { status: statusCode });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
