import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId } from "@/lib/server/data";
import { createRazorpayOrder, getRazorpayConfig } from "@/lib/server/razorpay";

type CheckoutRequest = {
  fullName?: string;
  email?: string;
  amount?: number;
  campaignId?: string | null;
  isAnonymous?: boolean;
};

const CURRENCY = "INR";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequest;
    const amount = Number(body.amount || 0);
    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();

    if (!fullName || !email || amount <= 0) {
      return NextResponse.json(
        { error: "fullName, email, and a positive amount are required." },
        { status: 400 },
      );
    }

    const tenantId = await getTenantId();
    const supabase = createAdminClient() as any;

    const { data: donor, error: donorError } = await supabase
      .from("donors")
      .upsert(
        {
          tenant_id: tenantId,
          full_name: fullName,
          email,
          is_anonymous: Boolean(body.isAnonymous),
        },
        { onConflict: "tenant_id,email" },
      )
      .select("id")
      .single();

    if (donorError) {
      throw new Error(donorError.message);
    }
    if (!donor) {
      throw new Error("Donor could not be created.");
    }

    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        tenant_id: tenantId,
        donor_id: donor.id,
        donor_name: fullName,
        donor_email: email,
        campaign_id: body.campaignId || null,
        amount,
        currency: CURRENCY,
        status: "pending",
        payment_method: "Razorpay Checkout",
        source: "web",
        payment_provider: "razorpay",
      })
      .select("id")
      .single();

    if (donationError) {
      throw new Error(donationError.message);
    }
    if (!donation) {
      throw new Error("Donation could not be created.");
    }

    const order = await createRazorpayOrder({
      amountInPaise: Math.round(amount * 100),
      currency: CURRENCY,
      receipt: donation.id,
      notes: {
        donation_id: donation.id,
        tenant_id: tenantId,
        donor_email: email,
      },
    });

    const { error: orderUpdateError } = await supabase
      .from("donations")
      .update({ razorpay_order_id: order.id })
      .eq("id", donation.id)
      .eq("tenant_id", tenantId);

    if (orderUpdateError) {
      throw new Error(orderUpdateError.message);
    }

    const { error: ledgerError } = await supabase.from("donation_ledger").insert({
      tenant_id: tenantId,
      donation_id: donation.id,
      donor_id: donor.id,
      campaign_id: body.campaignId || null,
      event_type: "donation_created",
      amount,
      currency: CURRENCY,
      provider_order_id: order.id,
      source: "checkout_api",
      metadata: { email, provider: "razorpay" },
    });
    if (ledgerError) {
      throw new Error(ledgerError.message);
    }

    const { error: auditError } = await supabase.from("audit_logs").insert({
      tenant_id: tenantId,
      actor_email: email,
      action: "donation_created",
      target_type: "donation",
      target_id: donation.id,
      metadata: {
        amount,
        currency: CURRENCY,
        campaign_id: body.campaignId || null,
        provider: "razorpay",
        provider_order_id: order.id,
      },
    });
    if (auditError) {
      throw new Error(auditError.message);
    }

    const { keyId } = getRazorpayConfig();

    return NextResponse.json(
      {
        donationId: donation.id,
        checkout: {
          key: keyId,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          name: "Impact Ledger Donation",
          description: body.campaignId ? "Campaign donation" : "General fund donation",
          prefill: {
            name: fullName,
            email,
          },
          notes: {
            donation_id: donation.id,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
