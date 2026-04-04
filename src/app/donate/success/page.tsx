"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { fetchJson } from "@/lib/api/client";
import { useSearchParams } from "next/navigation";

type DonationStatusResponse = {
  donation: {
    id: string;
    status: "pending" | "succeeded" | "failed" | "refunded" | "disputed";
    amount: number;
    currency: string;
    receiptUrl: string | null;
    donatedAt: string;
    orderId: string | null;
    paymentId: string | null;
  };
};

type InvoiceResponse = {
  invoice: {
    status: "sent" | "already_sent" | "skipped" | "failed";
    message: string;
    receiptUrl: string;
  };
};

const TERMINAL_STATES = new Set(["succeeded", "failed", "refunded", "disputed"]);

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);
}

function DonateSuccessPageContent() {
  const searchParams = useSearchParams();
  const donationId = searchParams.get("donationId");

  const [status, setStatus] = useState<DonationStatusResponse["donation"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoiceMessage, setInvoiceMessage] = useState<string | null>(null);
  const [invoiceDispatched, setInvoiceDispatched] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (!donationId) {
      setError("Missing donationId in URL.");
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const loadStatus = async () => {
      try {
        const response = await fetchJson<DonationStatusResponse>(`/api/donations/${donationId}/status`);
        if (cancelled) return;

        setStatus(response.donation);
        setError(null);

        if (!TERMINAL_STATES.has(response.donation.status)) {
          timer = setTimeout(loadStatus, 2000);
        }
      } catch (loadError) {
        if (cancelled) return;
        setError((loadError as Error).message);
      }
    };

    loadStatus();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [donationId]);

  useEffect(() => {
    if (!status || !donationId || status.status !== "succeeded" || invoiceDispatched) return;

    let cancelled = false;

    const sendInvoice = async () => {
      try {
        const response = await fetchJson<InvoiceResponse>(`/api/donations/${donationId}/invoice`, {
          method: "POST",
        });
        if (cancelled) return;
        setInvoiceMessage(response.invoice.message);
      } catch (invoiceError) {
        if (cancelled) return;
        setInvoiceMessage((invoiceError as Error).message);
      } finally {
        if (!cancelled) {
          setInvoiceDispatched(true);
          setShowSuccessDialog(true);
        }
      }
    };

    sendInvoice();

    return () => {
      cancelled = true;
    };
  }, [status, donationId, invoiceDispatched]);

  const message = useMemo(() => {
    if (!status) return "Confirming your payment...";
    if (status.status === "succeeded") return "Payment confirmed. Thank you for supporting Impact Ledger.";
    if (status.status === "pending") return "Payment is still being processed. This page refreshes automatically.";
    if (status.status === "failed") return "Payment failed. Please try again.";
    if (status.status === "refunded") return "This donation has been refunded.";
    return "This donation is currently under dispute review.";
  }, [status]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-grow px-6 py-24">
        <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-muted bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Donation Status</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {status && (
            <div className="space-y-2 text-sm">
              <p><span className="font-bold">Donation ID:</span> {status.id}</p>
              <p><span className="font-bold">Status:</span> {status.status}</p>
              <p><span className="font-bold">Amount:</span> {formatAmount(status.amount)}</p>
              {status.receiptUrl && (
                <p>
                  <a href={status.receiptUrl} target="_blank" rel="noreferrer" className="font-bold text-accent hover:underline">
                    View payment receipt
                  </a>
                </p>
              )}
            </div>
          )}
          {invoiceMessage && (
            <p className="text-sm text-muted-foreground">{invoiceMessage}</p>
          )}
          <div className="flex gap-4">
            <Link href="/donor/donations" className="btn-primary px-4 py-2 text-sm">View Donation History</Link>
            <Link href="/donate" className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary">Donate Again</Link>
          </div>
        </div>
        {showSuccessDialog && status?.status === "succeeded" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6">
            <div className="w-full max-w-md rounded-3xl border border-muted bg-white p-8 shadow-2xl">
              <h2 className="text-2xl font-display font-extrabold tracking-tight">Payment Successful</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Your UPI payment of {formatAmount(status.amount)} is confirmed.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {invoiceMessage || "Invoice receipt has been processed and linked to your donation record."}
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSuccessDialog(false)}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function DonateSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DonateSuccessPageContent />
    </Suspense>
  );
}
