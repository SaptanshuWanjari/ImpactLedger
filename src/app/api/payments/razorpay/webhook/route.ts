import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayWebhookSecret, verifyRazorpayWebhookSignature } from "@/lib/server/razorpay";

export const runtime = "nodejs";

type DonationUpdate = {
  status?: "pending" | "succeeded" | "failed" | "refunded" | "disputed";
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  provider_event_last_id?: string | null;
  receipt_url?: string | null;
  failure_reason?: string | null;
  refunded_amount?: number;
  payment_provider?: string;
};

type RazorpayPaymentEntity = {
  id: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error_description?: string;
  notes?: Record<string, unknown>;
};

type RazorpayRefundEntity = {
  id: string;
  payment_id?: string;
  amount?: number;
  notes?: Record<string, unknown>;
};

type RazorpayWebhookEvent = {
  account_id?: string;
  event: string;
  created_at?: number;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    refund?: { entity?: RazorpayRefundEntity };
  };
};

async function getDonationByOrderId(orderId: string) {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("donations")
    .select("id,tenant_id,donor_id,campaign_id,amount,currency,refunded_amount")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  return data;
}

async function getDonationByPaymentId(paymentId: string) {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("donations")
    .select("id,tenant_id,donor_id,campaign_id,amount,currency,refunded_amount")
    .eq("razorpay_payment_id", paymentId)
    .maybeSingle();
  return data;
}

async function updateDonation(donationId: string, tenantId: string, updates: DonationUpdate) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from("donations").update(updates).eq("id", donationId).eq("tenant_id", tenantId);
  if (error) throw new Error(error.message);
}

async function addLedgerEntry(input: {
  tenantId: string;
  donationId: string;
  donorId?: string | null;
  campaignId?: string | null;
  eventType: "donation_confirmed" | "donation_failed" | "donation_refunded";
  amount: number;
  currency: string;
  eventId: string;
  orderId?: string | null;
  paymentId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase.from("donation_ledger").insert({
    tenant_id: input.tenantId,
    donation_id: input.donationId,
    donor_id: input.donorId || null,
    campaign_id: input.campaignId || null,
    event_type: input.eventType,
    amount: input.amount,
    currency: input.currency,
    provider_event_id: input.eventId,
    provider_order_id: input.orderId || null,
    provider_payment_id: input.paymentId || null,
    source: "razorpay_webhook",
    metadata: input.metadata || {},
  });
  if (error) {
    throw new Error(error.message);
  }
}

async function markWebhookEvent(eventKey: string, status: "processed" | "ignored" | "failed", errorMessage?: string) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase
    .from("payment_webhook_events")
    .update({
      status,
      error_message: errorMessage || null,
      processed_at: new Date().toISOString(),
    })
    .eq("event_key", eventKey)
    .eq("provider", "razorpay");
  if (error) {
    throw new Error(error.message);
  }
}

function computeEventKey(payload: RazorpayWebhookEvent, rawBody: string) {
  const paymentId = payload.payload?.payment?.entity?.id || null;
  const refundId = payload.payload?.refund?.entity?.id || null;

  if (paymentId) return `${payload.event}:${paymentId}`;
  if (refundId) return `${payload.event}:${refundId}`;

  const digest = crypto.createHash("sha256").update(rawBody).digest("hex");
  return `${payload.event}:${digest}`;
}

async function handlePaymentCaptured(payload: RazorpayWebhookEvent, eventKey: string) {
  const payment = payload.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id) {
    return "ignored" as const;
  }

  const donationByOrder = await getDonationByOrderId(payment.order_id);
  const donation = donationByOrder || (await getDonationByPaymentId(payment.id));
  if (!donation) {
    return "ignored" as const;
  }

  await updateDonation(donation.id, donation.tenant_id, {
    status: "succeeded",
    razorpay_order_id: payment.order_id,
    razorpay_payment_id: payment.id,
    provider_event_last_id: eventKey,
    failure_reason: null,
    payment_provider: "razorpay",
  });

  await addLedgerEntry({
    tenantId: donation.tenant_id,
    donationId: donation.id,
    donorId: donation.donor_id,
    campaignId: donation.campaign_id,
    eventType: "donation_confirmed",
    amount: Number(donation.amount || (payment.amount || 0) / 100),
    currency: String(donation.currency || payment.currency || "INR").toUpperCase(),
    eventId: eventKey,
    orderId: payment.order_id,
    paymentId: payment.id,
  });

  return "processed" as const;
}

async function handlePaymentFailed(payload: RazorpayWebhookEvent, eventKey: string) {
  const payment = payload.payload?.payment?.entity;
  if (!payment?.id) {
    return "ignored" as const;
  }

  const donationByOrder = payment.order_id ? await getDonationByOrderId(payment.order_id) : null;
  const donation = donationByOrder || (await getDonationByPaymentId(payment.id));

  if (!donation) {
    return "ignored" as const;
  }

  await updateDonation(donation.id, donation.tenant_id, {
    status: "failed",
    razorpay_order_id: payment.order_id || null,
    razorpay_payment_id: payment.id,
    provider_event_last_id: eventKey,
    failure_reason: payment.error_description || "Payment failed",
    payment_provider: "razorpay",
  });

  await addLedgerEntry({
    tenantId: donation.tenant_id,
    donationId: donation.id,
    donorId: donation.donor_id,
    campaignId: donation.campaign_id,
    eventType: "donation_failed",
    amount: Number((payment.amount || 0) / 100),
    currency: String(payment.currency || donation.currency || "INR").toUpperCase(),
    eventId: eventKey,
    orderId: payment.order_id || null,
    paymentId: payment.id,
    metadata: { reason: payment.error_description || null },
  });

  return "processed" as const;
}

async function handleRefund(payload: RazorpayWebhookEvent, eventKey: string) {
  const refund = payload.payload?.refund?.entity;
  if (!refund?.id || !refund.payment_id) {
    return "ignored" as const;
  }

  const donation = await getDonationByPaymentId(refund.payment_id);
  if (!donation) {
    return "ignored" as const;
  }

  const refundAmount = Number((refund.amount || 0) / 100);
  const totalRefunded = Number(donation.refunded_amount || 0) + refundAmount;

  await updateDonation(donation.id, donation.tenant_id, {
    status: "refunded",
    razorpay_payment_id: refund.payment_id,
    provider_event_last_id: eventKey,
    refunded_amount: totalRefunded,
    payment_provider: "razorpay",
  });

  await addLedgerEntry({
    tenantId: donation.tenant_id,
    donationId: donation.id,
    donorId: donation.donor_id,
    campaignId: donation.campaign_id,
    eventType: "donation_refunded",
    amount: refundAmount,
    currency: String(donation.currency || "INR").toUpperCase(),
    eventId: eventKey,
    paymentId: refund.payment_id,
    metadata: { refund_id: refund.id },
  });

  return "processed" as const;
}

function extractTenantId(payload: RazorpayWebhookEvent) {
  const notes = payload.payload?.payment?.entity?.notes;
  const tenantId = typeof notes?.tenant_id === "string" ? notes.tenant_id : null;
  return tenantId;
}

export async function POST(request: NextRequest) {
  const webhookSecret = getRazorpayWebhookSecret();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing x-razorpay-signature header." }, { status: 400 });
  }

  const body = await request.text();
  const validSignature = verifyRazorpayWebhookSignature(body, signature, webhookSecret);

  if (!validSignature) {
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 });
  }

  let payload: RazorpayWebhookEvent;

  try {
    payload = JSON.parse(body) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const eventKey = computeEventKey(payload, body);
  const supabase = createAdminClient() as any;

  const { error: insertError } = await supabase.from("payment_webhook_events").insert({
    tenant_id: extractTenantId(payload),
    provider: "razorpay",
    event_key: eventKey,
    event_type: payload.event,
    status: "received",
    payload,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  try {
    let result: "processed" | "ignored" = "ignored";

    switch (payload.event) {
      case "payment.captured":
        result = await handlePaymentCaptured(payload, eventKey);
        break;
      case "payment.failed":
        result = await handlePaymentFailed(payload, eventKey);
        break;
      case "refund.created":
      case "refund.processed":
        result = await handleRefund(payload, eventKey);
        break;
      default:
        result = "ignored";
        break;
    }

    await markWebhookEvent(eventKey, result === "processed" ? "processed" : "ignored");
    return NextResponse.json({ received: true, status: result });
  } catch (error) {
    await markWebhookEvent(eventKey, "failed", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
