import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Stripe webhook is deprecated. Configure Razorpay webhook at /api/payments/razorpay/webhook.",
    },
    { status: 410 },
  );
}
