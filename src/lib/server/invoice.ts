import { createAdminClient } from "@/lib/supabase/admin";
import { createDonationReceiptPdf } from "@/lib/server/pdf";
import nodemailer from "nodemailer";

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
  payment_method: string | null;
  payment_provider: string | null;
};

function resolveAppUrl(origin?: string) {
  return process.env.NEXT_PUBLIC_APP_URL || origin || "http://localhost:3000";
}

function parseBoolean(value?: string | null) {
  if (!value) return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(amount || 0));
}

async function sendViaNodemailer(input: {
  to: string;
  donorName: string;
  amountInInr: number;
  amountLabel: string;
  campaignTitle: string;
  donatedAt: string;
  donationId: string;
  receiptUrl: string;
  orgName: string;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  pdf: Buffer;
}) {
  const smtpHost = (process.env.SMTP_HOST || "").trim();
  const smtpPort = Number(process.env.SMTP_PORT || "587");
  const smtpUser = (process.env.SMTP_USER || "").trim();
  const smtpPass = process.env.SMTP_PASS || "";
  const smtpSecure = parseBoolean(process.env.SMTP_SECURE);
  const testMode = parseBoolean(process.env.EMAIL_TEST_MODE);
  const testToEmail = (process.env.EMAIL_TEST_TO || "").trim();
  const from =
    process.env.DONATION_INVOICE_FROM_EMAIL ||
    "Impact Ledger <no-reply@localhost>";
  const toAddress = testMode && testToEmail ? testToEmail : input.to;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    return { sent: false as const, skipped: true as const, error: "Missing SMTP configuration." };
  }

  const subject = `${testMode ? "[TEST] " : ""}Donation Receipt: ${input.amountLabel}`;
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

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from,
      to: toAddress,
      subject,
      text,
      html,
      attachments: [
        {
          filename: `donation-receipt-${input.donationId}.pdf`,
          content: input.pdf,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (error) {
    return { sent: false as const, skipped: false as const, error: (error as Error).message };
  }

  return { sent: true as const, skipped: false as const, error: null };
}

async function storePdfInSupabase(input: {
  tenantId: string;
  donationId: string;
  pdf: Buffer;
}) {
  const supabase = createAdminClient() as any;
  const bucket = process.env.SUPABASE_RECEIPTS_BUCKET || "donation-receipts";
  const path = `${input.tenantId}/${input.donationId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, input.pdf, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return { ok: false as const, error: uploadError.message, url: null as string | null };
  }

  const signed = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 30);

  if (!signed.error && signed.data?.signedUrl) {
    return { ok: true as const, error: null, url: signed.data.signedUrl as string };
  }

  const publicResult = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = publicResult?.data?.publicUrl || null;

  if (!publicUrl) {
    return {
      ok: false as const,
      error: signed.error?.message || "Unable to create Supabase Storage URL for receipt.",
      url: null as string | null,
    };
  }

  return { ok: true as const, error: null, url: publicUrl as string };
}

export async function dispatchDonationInvoice(input: {
  donationId: string;
  origin?: string;
}) : Promise<DonationInvoiceDispatch> {
  const supabase = createAdminClient() as any;

  const { data, error } = await supabase
    .from("donations")
    .select("id,tenant_id,donor_email,donor_name,amount,status,donated_at,receipt_url,campaigns(title),payment_method,payment_provider")
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
  const pdf = createDonationReceiptPdf({
    donationId: donation.id,
    donorName,
    donorEmail,
    campaignTitle,
    amountInInr: Number(donation.amount || 0),
    donatedAtIso: donation.donated_at,
    orgName,
    receiptUrl,
    paymentMethod: donation.payment_method,
    paymentProvider: donation.payment_provider,
  });

  const sendResult = await sendViaNodemailer({
    to: donorEmail,
    donorName,
    amountInInr: Number(donation.amount || 0),
    amountLabel,
    campaignTitle,
    donatedAt: donation.donated_at,
    donationId: donation.id,
    receiptUrl,
    orgName,
    paymentMethod: donation.payment_method,
    paymentProvider: donation.payment_provider,
    pdf,
  });

  let status: DonationInvoiceDispatch["status"] = sendResult.sent
    ? "sent"
    : sendResult.skipped
      ? "skipped"
      : "failed";
  let resultMessage = sendResult.error || "Invoice dispatch skipped.";
  let resolvedReceiptUrl = receiptUrl;

  if (!sendResult.sent) {
    const storageResult = await storePdfInSupabase({
      tenantId: donation.tenant_id,
      donationId: donation.id,
      pdf,
    });

    if (storageResult.ok && storageResult.url) {
      resolvedReceiptUrl = storageResult.url;
      status = "sent";
      resultMessage = "Email unavailable; receipt stored in Supabase and ready to share.";

      await supabase
        .from("donations")
        .update({ receipt_url: resolvedReceiptUrl })
        .eq("id", donation.id)
        .eq("tenant_id", donation.tenant_id);
    }
  }

  await supabase.from("audit_logs").insert({
    tenant_id: donation.tenant_id,
    actor_email: donorEmail,
    action: "donation_invoice_sent",
    target_type: "donation",
    target_id: donation.id,
    metadata: {
      delivery: status,
      reason: resultMessage,
      receipt_url: resolvedReceiptUrl,
    },
  });

  return {
    status,
    message: sendResult.sent ? "Invoice sent successfully via SMTP." : resultMessage,
    receiptUrl: resolvedReceiptUrl,
  };
}
