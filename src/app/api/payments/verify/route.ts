import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchDonationInvoice } from "@/lib/server/invoice";
import { getRazorpayConfig } from "@/lib/server/razorpay";

type VerifyRequest = {
  donationId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
};

const CURRENCY = "INR";

function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const { keySecret } = getRazorpayConfig();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(signature, "utf8");

  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyRequest;

    if (!body.donationId || !body.razorpayPaymentId || !body.razorpayOrderId || !body.razorpaySignature) {
      return NextResponse.json(
        {
          error: "donationId, razorpayPaymentId, razorpayOrderId, and razorpaySignature are required.",
        },
        { status: 400 },
      );
    }

    const isValid = verifyPaymentSignature(body.razorpayOrderId, body.razorpayPaymentId, body.razorpaySignature);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;

    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select("id,tenant_id,donor_id,campaign_id,donor_email,amount,status,payment_method,razorpay_order_id,razorpay_payment_id,receipt_url")
      .eq("id", body.donationId)
      .single();

    if (donationError || !donation) {
      return NextResponse.json({ error: donationError?.message || "Donation not found." }, { status: 404 });
    }

    if (donation.razorpay_order_id && donation.razorpay_order_id !== body.razorpayOrderId) {
      return NextResponse.json({ error: "Order mismatch for this donation." }, { status: 409 });
    }

    if (donation.status === "succeeded" && donation.razorpay_payment_id === body.razorpayPaymentId) {
      const receiptUrl =
        donation.receipt_url || `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/donate/success?donationId=${encodeURIComponent(donation.id)}`;
      const invoice = await dispatchDonationInvoice({
        donationId: donation.id,
        origin: request.nextUrl.origin,
      });

      return NextResponse.json({
        verified: true,
        donationId: donation.id,
        status: "succeeded",
        currency: CURRENCY,
        receiptUrl,
        invoice,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const receiptUrl = `${appUrl}/donate/success?donationId=${encodeURIComponent(donation.id)}`;

    const resolvedPaymentMethod = donation.payment_method === "Card" ? "Card" : "UPI";

    const { error: updateError } = await supabase
      .from("donations")
      .update({
        status: "succeeded",
        currency: CURRENCY,
        payment_method: resolvedPaymentMethod,
        payment_provider: "razorpay",
        razorpay_order_id: body.razorpayOrderId,
        razorpay_payment_id: body.razorpayPaymentId,
        razorpay_signature: body.razorpaySignature,
        receipt_url: receiptUrl,
        failure_reason: null,
      })
      .eq("id", donation.id)
      .eq("tenant_id", donation.tenant_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const providerEventId = `client_verify:${body.razorpayPaymentId}`;
    const { error: ledgerError } = await supabase.from("donation_ledger").insert({
      tenant_id: donation.tenant_id,
      donation_id: donation.id,
      donor_id: donation.donor_id || null,
      campaign_id: donation.campaign_id || null,
      event_type: "donation_confirmed",
      amount: Number(donation.amount || 0),
      currency: CURRENCY,
      provider_event_id: providerEventId,
      provider_order_id: body.razorpayOrderId,
      provider_payment_id: body.razorpayPaymentId,
      source: "checkout_api",
      metadata: { verification: "client_signature", provider: "razorpay" },
    });

    if (ledgerError && ledgerError.code !== "23505") {
      throw new Error(ledgerError.message);
    }

    const { error: auditError } = await supabase.from("audit_logs").insert({
      tenant_id: donation.tenant_id,
      actor_email: donation.donor_email || null,
      action: "donation_confirmed",
      target_type: "donation",
      target_id: donation.id,
      metadata: {
        provider: "razorpay",
        payment_method: resolvedPaymentMethod,
        provider_payment_id: body.razorpayPaymentId,
      },
    });

    if (auditError) {
      throw new Error(auditError.message);
    }

    const invoice = await dispatchDonationInvoice({
      donationId: donation.id,
      origin: request.nextUrl.origin,
    });

    return NextResponse.json({
      verified: true,
      donationId: donation.id,
      status: "succeeded",
      currency: CURRENCY,
      receiptUrl,
      invoice,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
