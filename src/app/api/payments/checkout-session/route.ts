import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantId } from "@/lib/server/data";
import { getAppUrl, getStripeClient } from "@/lib/server/stripe";

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
        payment_method: "Stripe Checkout",
        source: "web",
      })
      .select("id")
      .single();

    if (donationError) {
      throw new Error(donationError.message);
    }
    if (!donation) {
      throw new Error("Donation could not be created.");
    }

    const appUrl = getAppUrl();
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      success_url: `${appUrl}/donate/success?donationId=${donation.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/donate/cancel?donationId=${donation.id}`,
      metadata: {
        donation_id: donation.id,
        tenant_id: tenantId,
      },
      payment_intent_data: {
        metadata: {
          donation_id: donation.id,
          tenant_id: tenantId,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY.toLowerCase(),
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: "Impact Ledger Donation",
              description: body.campaignId ? "Campaign donation" : "General fund donation",
            },
          },
        },
      ],
    });

    const { error: sessionUpdateError } = await supabase
      .from("donations")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", donation.id)
      .eq("tenant_id", tenantId);

    if (sessionUpdateError) {
      throw new Error(sessionUpdateError.message);
    }

    const { error: ledgerError } = await supabase.from("donation_ledger").insert({
      tenant_id: tenantId,
      donation_id: donation.id,
      donor_id: donor.id,
      campaign_id: body.campaignId || null,
      event_type: "donation_created",
      amount,
      currency: CURRENCY,
      stripe_checkout_session_id: session.id,
      source: "checkout_api",
      metadata: { email },
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
        stripe_checkout_session_id: session.id,
      },
    });
    if (auditError) {
      throw new Error(auditError.message);
    }

    if (!session.url) {
      throw new Error("Stripe checkout URL was not returned.");
    }

    return NextResponse.json(
      { checkoutUrl: session.url, donationId: donation.id, sessionId: session.id },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
