import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/server/stripe";

export const runtime = "nodejs";

type DonationUpdate = {
  status?: "pending" | "succeeded" | "failed" | "refunded" | "disputed";
  stripe_payment_intent_id?: string | null;
  stripe_charge_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_event_last_id?: string;
  receipt_url?: string | null;
  failure_reason?: string | null;
  refunded_amount?: number;
  dispute_status?: string;
};

async function getDonationBySessionId(sessionId: string) {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("donations")
    .select("id,tenant_id,donor_id,campaign_id,amount,currency")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();
  return data;
}

async function getDonationByPaymentIntentId(paymentIntentId: string) {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("donations")
    .select("id,tenant_id,donor_id,campaign_id,amount,currency")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  return data;
}

async function getDonationByChargeId(chargeId: string) {
  const supabase = createAdminClient() as any;
  const { data } = await supabase
    .from("donations")
    .select("id,tenant_id,donor_id,campaign_id,amount,currency")
    .eq("stripe_charge_id", chargeId)
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
  eventType: "donation_confirmed" | "donation_failed" | "donation_refunded" | "donation_disputed";
  amount: number;
  currency: string;
  eventId: string;
  paymentIntentId?: string | null;
  chargeId?: string | null;
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
    stripe_event_id: input.eventId,
    stripe_payment_intent_id: input.paymentIntentId || null,
    stripe_charge_id: input.chargeId || null,
    source: "stripe_webhook",
    metadata: input.metadata || {},
  });
  if (error) {
    throw new Error(error.message);
  }
}

async function markWebhookEvent(eventId: string, status: "processed" | "ignored" | "failed", errorMessage?: string) {
  const supabase = createAdminClient() as any;
  const { error } = await supabase
    .from("stripe_webhook_events")
    .update({
      status,
      error_message: errorMessage || null,
      processed_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);
  if (error) {
    throw new Error(error.message);
  }
}

function extractTenantId(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.metadata?.tenant_id || null;
  }
  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    return intent.metadata?.tenant_id || null;
  }
  return null;
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const stripe = getStripeClient();
  const session = event.data.object as Stripe.Checkout.Session;
  const donationBySession = await getDonationBySessionId(session.id);
  const donationId = session.metadata?.donation_id || donationBySession?.id;
  const tenantId = session.metadata?.tenant_id || donationBySession?.tenant_id;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;

  if (!donationId || !tenantId) {
    return "ignored";
  }

  let chargeId: string | null = null;
  let receiptUrl: string | null = null;

  if (paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });
    const latestCharge = paymentIntent.latest_charge;
    if (latestCharge && typeof latestCharge !== "string") {
      chargeId = latestCharge.id;
      receiptUrl = latestCharge.receipt_url || null;
    }
  }

  await updateDonation(donationId, tenantId, {
    status: "succeeded",
    stripe_payment_intent_id: paymentIntentId,
    stripe_charge_id: chargeId,
    stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
    stripe_event_last_id: event.id,
    receipt_url: receiptUrl,
    failure_reason: null,
  });

  await addLedgerEntry({
    tenantId,
    donationId,
    donorId: donationBySession?.donor_id,
    campaignId: donationBySession?.campaign_id,
    eventType: "donation_confirmed",
    amount: Number(donationBySession?.amount || Number(session.amount_total || 0) / 100),
    currency: String(donationBySession?.currency || session.currency || "INR").toUpperCase(),
    eventId: event.id,
    paymentIntentId,
    chargeId,
  });

  return "processed";
}

async function handlePaymentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const donationByPaymentIntent = await getDonationByPaymentIntentId(paymentIntent.id);
  const donationId = paymentIntent.metadata?.donation_id || donationByPaymentIntent?.id;
  const tenantId = paymentIntent.metadata?.tenant_id || donationByPaymentIntent?.tenant_id;

  if (!donationId || !tenantId) {
    return "ignored";
  }

  await updateDonation(donationId, tenantId, {
    status: "failed",
    stripe_payment_intent_id: paymentIntent.id,
    stripe_event_last_id: event.id,
    failure_reason: paymentIntent.last_payment_error?.message || "Payment failed",
  });

  await addLedgerEntry({
    tenantId,
    donationId,
    donorId: donationByPaymentIntent?.donor_id,
    campaignId: donationByPaymentIntent?.campaign_id,
    eventType: "donation_failed",
    amount: Number((paymentIntent.amount || 0) / 100),
    currency: String(paymentIntent.currency || donationByPaymentIntent?.currency || "INR").toUpperCase(),
    eventId: event.id,
    paymentIntentId: paymentIntent.id,
    metadata: { reason: paymentIntent.last_payment_error?.message || null },
  });

  return "processed";
}

async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const donation = await getDonationByChargeId(charge.id);
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  const fallbackDonation = paymentIntentId ? await getDonationByPaymentIntentId(paymentIntentId) : null;

  const target = donation || fallbackDonation;
  if (!target) {
    return "ignored";
  }

  const refundedAmount = Number((charge.amount_refunded || 0) / 100);
  await updateDonation(target.id, target.tenant_id, {
    status: "refunded",
    stripe_event_last_id: event.id,
    stripe_charge_id: charge.id,
    stripe_payment_intent_id: paymentIntentId,
    refunded_amount: refundedAmount,
    receipt_url: charge.receipt_url || null,
  });

  await addLedgerEntry({
    tenantId: target.tenant_id,
    donationId: target.id,
    donorId: target.donor_id,
    campaignId: target.campaign_id,
    eventType: "donation_refunded",
    amount: refundedAmount,
    currency: String(charge.currency || target.currency || "INR").toUpperCase(),
    eventId: event.id,
    paymentIntentId,
    chargeId: charge.id,
  });

  return "processed";
}

async function handleChargeDisputeCreated(event: Stripe.Event) {
  const dispute = event.data.object as Stripe.Dispute;
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : null;
  if (!chargeId) {
    return "ignored";
  }

  const donation = await getDonationByChargeId(chargeId);
  if (!donation) {
    return "ignored";
  }

  await updateDonation(donation.id, donation.tenant_id, {
    status: "disputed",
    stripe_event_last_id: event.id,
    stripe_charge_id: chargeId,
    dispute_status: dispute.status,
  });

  await addLedgerEntry({
    tenantId: donation.tenant_id,
    donationId: donation.id,
    donorId: donation.donor_id,
    campaignId: donation.campaign_id,
    eventType: "donation_disputed",
    amount: Number((dispute.amount || 0) / 100),
    currency: String(dispute.currency || donation.currency || "INR").toUpperCase(),
    eventId: event.id,
    chargeId,
    metadata: { dispute_status: dispute.status, reason: dispute.reason },
  });

  return "processed";
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${(error as Error).message}` }, { status: 400 });
  }

  const supabase = createAdminClient() as any;
  const tenantId = extractTenantId(event);
  const { error: eventInsertError } = await supabase.from("stripe_webhook_events").insert({
    tenant_id: tenantId,
    event_id: event.id,
    event_type: event.type,
    api_version: event.api_version || null,
    livemode: event.livemode,
    status: "received",
    payload: event as unknown as Record<string, unknown>,
  });

  if (eventInsertError) {
    if (eventInsertError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: eventInsertError.message }, { status: 500 });
  }

  try {
    let result: "processed" | "ignored" = "ignored";
    switch (event.type) {
      case "checkout.session.completed":
        result = await handleCheckoutCompleted(event);
        break;
      case "payment_intent.payment_failed":
        result = await handlePaymentFailed(event);
        break;
      case "charge.refunded":
        result = await handleChargeRefunded(event);
        break;
      case "charge.dispute.created":
        result = await handleChargeDisputeCreated(event);
        break;
      default:
        result = "ignored";
    }

    await markWebhookEvent(event.id, result === "processed" ? "processed" : "ignored");
    return NextResponse.json({ received: true, status: result });
  } catch (error) {
    await markWebhookEvent(event.id, "failed", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
