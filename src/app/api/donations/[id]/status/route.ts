import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = createAdminClient() as any;

    let { data, error } = await supabase
      .from("donations")
      .select("id,status,amount,currency,receipt_url,donated_at,razorpay_order_id,razorpay_payment_id")
      .eq("id", id)
      .single();

    if (error?.message?.includes("razorpay_order_id") || error?.message?.includes("razorpay_payment_id")) {
      const fallback = await supabase
        .from("donations")
        .select("id,status,amount,currency,receipt_url,donated_at")
        .eq("id", id)
        .single();
      data = fallback.data
        ? {
            ...fallback.data,
            razorpay_order_id: null,
            razorpay_payment_id: null,
          }
        : null;
      error = fallback.error;
    }

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Donation not found." }, { status: 404 });
    }

    return NextResponse.json({
      donation: {
        id: data.id,
        status: data.status,
        amount: Number(data.amount || 0),
        currency: "INR",
        receiptUrl: data.receipt_url || null,
        donatedAt: data.donated_at,
        orderId: data.razorpay_order_id || null,
        paymentId: data.razorpay_payment_id || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
