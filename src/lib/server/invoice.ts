import { createAdminClient } from "@/lib/supabase/admin";
import { createDonationReceiptPdf } from "@/lib/server/pdf";

export type DonationInvoiceDispatch = {
  status: "sent" | "already_sent" | "skipped" | "failed";
  message: string;
  receiptUrl: string;
};

type DonationRow = {
  id: string;
  tenant_id: string;
  donor_email: string | null;
  donor_name: string | null;
  amount: number;
  status: string;
  donated_at: string;
  receipt_url: string | null;
  campaigns: { title: string | null } | null;
};

function resolveAppUrl(origin?: string) {
  return process.env.NEXT_PUBLIC_APP_URL || origin || "http://localhost:3000";
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(amount || 0));
}

async function sendViaResend(input: {
  to: string;
  donorName: string;
  amountInInr: number;
  amountLabel: string;
  campaignTitle: string;
  donatedAt: string;
  donationId: string;
  receiptUrl: string;
  orgName: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.DONATION_INVOICE_FROM_EMAIL || "Impact Ledger <donations@impactledger.app>";

  if (!resendApiKey) {
    return { sent: false as const, skipped: true as const, error: "Missing RESEND_API_KEY" };
  }

  const subject = `Donation Receipt: ${input.amountLabel}`;
  const text = [
    `Hello ${input.donorName},`,
    "",
    `Thank you for your donation to ${input.orgName}.`,
    "Your PDF donation receipt is attached to this email.",
    "",
    "This is your official payment receipt.",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 16px">Donation Receipt</h2>
      <p>Hello ${input.donorName},</p>
      <p>Thank you for supporting <strong>${input.orgName}</strong>.</p>
      <p>Your PDF donation receipt is attached to this email.</p>
      <p style="color:#555">This is your official payment receipt.</p>
    </div>
  `;

  const pdf = createDonationReceiptPdf({
    donationId: input.donationId,
    donorName: input.donorName,
    donorEmail: input.to,
    campaignTitle: input.campaignTitle,
    amountInInr: input.amountInInr,
    donatedAtIso: input.donatedAt,
    orgName: input.orgName,
    receiptUrl: input.receiptUrl,
  });
  const encodedPdf = pdf.toString("base64");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject,
      text,
      html,
      attachments: [
        {
          filename: `donation-receipt-${input.donationId}.pdf`,
          content: encodedPdf,
        },
      ],
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    return { sent: false as const, skipped: false as const, error: payload || `Resend failed: ${response.status}` };
  }

  return { sent: true as const, skipped: false as const, error: null };
}

export async function dispatchDonationInvoice(input: {
  donationId: string;
  origin?: string;
}) : Promise<DonationInvoiceDispatch> {
  const supabase = createAdminClient() as any;

  const { data, error } = await supabase
    .from("donations")
    .select("id,tenant_id,donor_email,donor_name,amount,status,donated_at,receipt_url,campaigns(title)")
    .eq("id", input.donationId)
    .single();

  if (error || !data) {
    return {
      status: "failed",
      message: error?.message || "Donation not found for invoice dispatch.",
      receiptUrl: "",
    };
  }

  const donation = data as DonationRow;
  const appUrl = resolveAppUrl(input.origin);
  const receiptUrl = donation.receipt_url || `${appUrl}/donate/success?donationId=${encodeURIComponent(donation.id)}`;

  if (!donation.receipt_url) {
    await supabase
      .from("donations")
      .update({ receipt_url: receiptUrl })
      .eq("id", donation.id)
      .eq("tenant_id", donation.tenant_id);
  }

  if (donation.status !== "succeeded") {
    return {
      status: "skipped",
      message: "Invoice dispatch skipped because payment is not succeeded.",
      receiptUrl,
    };
  }

  const { data: existingAudit } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("tenant_id", donation.tenant_id)
    .eq("target_type", "donation")
    .eq("target_id", donation.id)
    .eq("action", "donation_invoice_sent")
    .maybeSingle();

  if (existingAudit?.id) {
    return {
      status: "already_sent",
      message: "Invoice already sent for this donation.",
      receiptUrl,
    };
  }

  const donorEmail = donation.donor_email || "";

  if (!donorEmail) {
    return {
      status: "failed",
      message: "Cannot send invoice without donor email.",
      receiptUrl,
    };
  }

  const amountLabel = formatAmount(donation.amount);
  const campaignTitle = donation.campaigns?.title || "General Impact Fund";
  const orgName = "Impact Ledger";
  const donorName = donation.donor_name || donorEmail.split("@")[0] || "Supporter";

  const sendResult = await sendViaResend({
    to: donorEmail,
    donorName,
    amountInInr: Number(donation.amount || 0),
    amountLabel,
    campaignTitle,
    donatedAt: donation.donated_at,
    donationId: donation.id,
    receiptUrl,
    orgName,
  });

  const status = sendResult.sent
    ? "sent"
    : sendResult.skipped
      ? "skipped"
      : "failed";

  await supabase.from("audit_logs").insert({
    tenant_id: donation.tenant_id,
    actor_email: donorEmail,
    action: "donation_invoice_sent",
    target_type: "donation",
    target_id: donation.id,
    metadata: {
      delivery: status,
      reason: sendResult.error,
      receipt_url: receiptUrl,
    },
  });

  return {
    status,
    message: sendResult.sent
      ? "Invoice sent successfully."
      : sendResult.error || "Invoice dispatch skipped.",
    receiptUrl,
  };
}
