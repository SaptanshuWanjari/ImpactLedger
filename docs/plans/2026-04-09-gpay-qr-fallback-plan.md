# GPay QR Fallback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a simple toggle to switch the payment method from Razorpay to a static GPay QR fallback.

**Architecture:** Client-side payment toggle, API modification to create manual donation records, and a new manual success page.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Supabase

---

### Task 1: Update API Route for Checkout Session

**Files:**
- Modify: `src/app/api/payments/checkout-session/route.ts`

**Step 1: Write the updated implementation**

```typescript
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
  provider?: "razorpay" | "gpay";
};

const CURRENCY = "INR";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutRequest;
    const amount = Number(body.amount || 0);
    const fullName = (body.fullName || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const provider = body.provider || "razorpay";

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
        payment_method: provider === "gpay" ? "GPay QR" : "UPI",
        source: "web",
        payment_provider: provider,
      })
      .select("id")
      .single();

    if (donationError) {
      throw new Error(donationError.message);
    }
    if (!donation) {
      throw new Error("Donation could not be created.");
    }

    if (provider === "gpay") {
      const { error: ledgerError } = await supabase.from("donation_ledger").insert({
        tenant_id: tenantId,
        donation_id: donation.id,
        donor_id: donor.id,
        campaign_id: body.campaignId || null,
        event_type: "donation_created",
        amount,
        currency: CURRENCY,
        provider_order_id: null,
        source: "checkout_api",
        metadata: { email, provider: "gpay" },
      });
      if (ledgerError) throw new Error(ledgerError.message);

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
          provider: "gpay",
        },
      });
      if (auditError) throw new Error(auditError.message);

      return NextResponse.json(
        {
          donationId: donation.id,
          manual: true,
        },
        { status: 201 },
      );
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
        manual: false,
        checkout: {
          key: keyId,
          orderId: order.id,
          amount: order.amount,
          currency: CURRENCY,
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
```

**Step 2: Commit**

```bash
git add src/app/api/payments/checkout-session/route.ts
git commit -m "feat: add gpay manual provider to checkout session"
```

### Task 2: Add Manual Success Page

**Files:**
- Create: `src/app/donate/manual-success/page.tsx`

**Step 1: Write minimal implementation**

```tsx
"use client";

import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSearchParams } from "next/navigation";

export default function ManualSuccessPage() {
  const searchParams = useSearchParams();
  const donationId = searchParams.get("donationId");

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-grow px-6 py-24">
        <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-muted bg-white p-8 shadow-sm text-center">
          <div className="w-20 h-20 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Payment Pending Verification</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Thank you for your donation. Since you paid via manual Google Pay QR, our team will verify the payment shortly and update your receipt.
          </p>
          {donationId && (
             <p className="text-sm font-bold mt-4">Donation ID: {donationId}</p>
          )}
          <div className="flex justify-center gap-4 mt-8">
            <Link href="/donor/donations" className="btn-primary px-4 py-2 text-sm">View Donation History</Link>
            <Link href="/donate" className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary">Donate Again</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/donate/manual-success/page.tsx
git commit -m "feat: add manual success page for gpay"
```

### Task 3: Update Donate Page UI

**Files:**
- Modify: `src/app/donate/page.tsx`

**Step 1: Read the existing file and apply modifications**
Use sed or Edit tool to make the following changes:
1. Update `paymentMethods` array to include GPay:
```tsx
const paymentMethods = [
  {
    id: "wallet",
    name: "Razorpay (Automated)",
    icon: Wallet,
    description: "Credit/Debit Cards, UPI, Netbanking",
  },
  {
    id: "gpay_qr",
    name: "Google Pay QR (Manual)",
    icon: ShieldCheck,
    description: "Scan QR code to pay manually",
  },
];
```

2. Add a static QR Image constant near the top:
```tsx
const STATIC_QR_URL = "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"; // Placeholder
```

3. Update `canProceedStep` to allow `gpay_qr`:
```tsx
    if (currentStep === 2) return hasValidAmount && hasValidDetails && (selectedMethod === "wallet" || selectedMethod === "gpay_qr");
    return hasValidAmount && hasValidDetails && (selectedMethod === "wallet" || selectedMethod === "gpay_qr");
```

4. Update `submitDonation` to pass the provider and handle the manual branch:
```tsx
  async function submitDonation() {
    if (!hasValidAmount || !hasValidDetails) {
      setResultMessage("Enter a valid INR amount, full name, and email before continuing.");
      return;
    }
    if (selectedMethod !== "wallet" && selectedMethod !== "gpay_qr") {
      setResultMessage("Invalid payment method selected.");
      return;
    }

    setSubmitting(true);
    setResultMessage(null);

    try {
      const response = await fetchJson<any>(
        "/api/payments/checkout-session",
        {
          method: "POST",
          body: JSON.stringify({
            fullName,
            email,
            amount: amountNumber,
            campaignId: campaignId === "general" ? null : campaignId,
            isAnonymous,
            provider: selectedMethod === "gpay_qr" ? "gpay" : "razorpay",
          }),
        },
      );

      if (response.manual) {
        // If manual, redirect to the new manual-success page
        window.location.href = `/donate/manual-success?donationId=${encodeURIComponent(response.donationId)}`;
        return;
      }

      // Existing razorpay code here...
      const scriptLoaded = await loadRazorpayCheckoutScript();
      // ... 
```

5. Update Step 3 (Review & Confirm) to show QR code *if* `gpay_qr` is selected:
```tsx
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 grow text-center"
                  >
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck size={40} />
                    </div>
                    <h3 className="text-3xl font-display font-bold">
                      {selectedMethod === "gpay_qr" ? "Scan to Pay" : "Review & Confirm"}
                    </h3>
                    <div className="bg-muted/30 p-8 rounded-3xl mb-5 space-y-4 max-w-md mx-auto text-left">
                      <div className="flex justify-between">
                        <span>Amount</span>
                        <span className="font-bold">{finalAmountLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Donor</span>
                        <span className="font-bold">{fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Method</span>
                        <span className="font-bold">
                          {
                            paymentMethods.find((m) => m.id === selectedMethod)
                              ?.name
                          }
                        </span>
                      </div>
                      {selectedMethod === "gpay_qr" && (
                        <div className="mt-6 flex flex-col items-center justify-center pt-4 border-t border-muted">
                           <p className="text-sm text-center mb-4 text-muted-foreground">Scan the QR code with your Google Pay app to complete the transaction of {finalAmountLabel}.</p>
                           <img src={STATIC_QR_URL} alt="GPay QR Code" className="w-48 h-48 rounded-lg shadow-sm border border-muted" />
                        </div>
                      )}
                    </div>
                    {resultMessage && (
                      <p className="text-sm text-red-600">
                        {resultMessage}
                      </p>
                    )}
                  </motion.div>
```

6. Update the Continue button logic
```tsx
                <button
                  onClick={async () => {
                    if (currentStep === steps.length - 1) {
                      await submitDonation();
                      return;
                    }
                    nextStep();
                  }}
                  disabled={submitting || !canProceedStep}
                  className="btn-primary flex items-center gap-2 py-3 px-8 disabled:opacity-50"
                >
                  {currentStep === steps.length - 1
                    ? submitting
                      ? "Submitting..."
                      : selectedMethod === "gpay_qr" ? "I've Paid" : "Finalize Stewardship"
                    : "Continue"}
                  <ArrowRight size={18} />
                </button>
```

**Step 2: Commit**

```bash
git add src/app/donate/page.tsx
git commit -m "feat: add gpay qr fallback UI to donate flow"
```

---

End of Implementation Plan
