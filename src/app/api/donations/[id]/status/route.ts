import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = createAdminClient() as any;

    const { data, error } = await supabase
      .from("donations")
      .select("id,status,amount,currency,receipt_url,donated_at,stripe_checkout_session_id")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Donation not found." }, { status: 404 });
    }

    return NextResponse.json({
      donation: {
        id: data.id,
        status: data.status,
        amount: Number(data.amount || 0),
        currency: data.currency || "INR",
        receiptUrl: data.receipt_url || null,
        donatedAt: data.donated_at,
        sessionId: data.stripe_checkout_session_id || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
