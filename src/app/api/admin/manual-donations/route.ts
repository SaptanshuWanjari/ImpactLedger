import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchDonationInvoice } from "@/lib/server/invoice";
import { ADMIN_ALLOWED_ROLES, AuthHttpError, requireAuthContext } from "@/lib/server/auth";

type ActionBody = {
  donationId?: string;
  action?: "verify" | "send_receipt" | "decline";
};

function resolveReceiptUrl(donationId: string, origin: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  return `${appUrl}/donate/success?donationId=${encodeURIComponent(donationId)}`;
}

export async function GET() {
  try {
    const context = await requireAuthContext(ADMIN_ALLOWED_ROLES);
    const supabase = createAdminClient() as any;

    const { data, error } = await supabase
      .from("donations")
      .select("id,tenant_id,donor_name,donor_email,amount,currency,status,payment_method,payment_provider,donated_at,receipt_url,payment_screenshot_url,campaigns(title)")
      .eq("tenant_id", context.tenantId)
      .eq("payment_method", "GPay QR")
      .order("donated_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      donations: (data || []).map((row: any) => ({
        id: row.id,
        donorName: row.donor_name || "Anonymous",
        donorEmail: row.donor_email || "",
        amount: Number(row.amount || 0),
        currency: row.currency || "INR",
        status: row.status,
        paymentMethod: row.payment_method || "GPay QR",
        paymentProvider: row.payment_provider || "razorpay",
        donatedAt: row.donated_at,
        receiptUrl: row.receipt_url || null,
        screenshotUrl: row.payment_screenshot_url || null,
        campaign: row.campaigns?.title || "General Fund",
      })),
    });
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuthContext(ADMIN_ALLOWED_ROLES);
    const body = (await request.json()) as ActionBody;

    if (!body.donationId || !body.action) {
      return NextResponse.json({ error: "donationId and action are required." }, { status: 400 });
    }

    if (!(["verify", "send_receipt", "decline"] as const).includes(body.action as "verify" | "send_receipt" | "decline")) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const supabase = createAdminClient() as any;
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .select("id,tenant_id,donor_id,campaign_id,donor_email,amount,currency,status,payment_method,payment_provider,receipt_url,payment_screenshot_url")
      .eq("tenant_id", context.tenantId)
      .eq("id", body.donationId)
      .single();

    if (donationError || !donation) {
      return NextResponse.json({ error: donationError?.message || "Donation not found." }, { status: 404 });
    }

    if (donation.payment_method !== "GPay QR") {
      return NextResponse.json({ error: "Only manual QR donations can be handled here." }, { status: 400 });
    }

    if (body.action === "verify") {
      const receiptUrl = donation.receipt_url || resolveReceiptUrl(donation.id, request.nextUrl.origin);
      const providerEventId = `admin_verify:${donation.id}`;

      if (donation.status !== "succeeded") {
        const { error: updateError } = await supabase
          .from("donations")
          .update({
            status: "succeeded",
            currency: donation.currency || "INR",
            payment_method: "GPay QR",
            payment_provider: "gpay",
            receipt_url: receiptUrl,
            failure_reason: null,
          })
          .eq("tenant_id", context.tenantId)
          .eq("id", donation.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      // Always ensure the confirmation event exists for donor acceptance logs.
      const { error: ledgerError } = await supabase.from("donation_ledger").insert({
        tenant_id: context.tenantId,
        donation_id: donation.id,
        donor_id: donation.donor_id || null,
        campaign_id: donation.campaign_id || null,
        event_type: "donation_confirmed",
        amount: Number(donation.amount || 0),
        currency: donation.currency || "INR",
        provider_event_id: providerEventId,
        source: "admin_action",
        metadata: {
          provider: "gpay",
          verification: "manual_admin",
        },
      });

      if (ledgerError && ledgerError.code !== "23505") {
        throw new Error(ledgerError.message);
      }

      if (donation.status !== "succeeded") {
        const { error: auditError } = await supabase.from("audit_logs").insert({
          tenant_id: context.tenantId,
          actor_user_id: context.user.id,
          actor_email: context.email,
          action: "donation_confirmed_manual",
          target_type: "donation",
          target_id: donation.id,
          metadata: {
            payment_method: "GPay QR",
            provider: "gpay",
          },
        });

        if (auditError) {
          throw new Error(auditError.message);
        }
      }

      const invoice = await dispatchDonationInvoice({
        donationId: donation.id,
        origin: request.nextUrl.origin,
      });

      return NextResponse.json({
        donation: {
          id: donation.id,
          status: "succeeded",
          receiptUrl: invoice.receiptUrl || receiptUrl,
        },
        invoice,
      });
    }

    if (body.action === "decline") {
      if (donation.status === "succeeded") {
        return NextResponse.json({ error: "Cannot decline an already-verified donation." }, { status: 400 });
      }

      const { error: declineError } = await supabase
        .from("donations")
        .update({
          status: "failed",
          failure_reason: "Declined by admin: payment screenshot rejected.",
        })
        .eq("tenant_id", context.tenantId)
        .eq("id", donation.id);

      if (declineError) {
        throw new Error(declineError.message);
      }

      await supabase.from("audit_logs").insert({
        tenant_id: context.tenantId,
        actor_user_id: context.user.id,
        actor_email: context.email,
        action: "donation_declined_manual",
        target_type: "donation",
        target_id: donation.id,
        metadata: { payment_method: "GPay QR", reason: "admin_declined" },
      });

      return NextResponse.json({
        donation: {
          id: donation.id,
          status: "failed",
          receiptUrl: donation.receipt_url || null,
        },
      });
    }

    const invoice = await dispatchDonationInvoice({
      donationId: donation.id,
      origin: request.nextUrl.origin,
    });

    return NextResponse.json({
      donation: {
        id: donation.id,
        status: donation.status,
        receiptUrl: invoice.receiptUrl || donation.receipt_url || null,
      },
      invoice,
    });
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
