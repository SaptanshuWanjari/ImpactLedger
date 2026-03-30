"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
    sessionId: string | null;
  };
};

const TERMINAL_STATES = new Set(["succeeded", "failed", "refunded", "disputed"]);

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
  }).format(amount || 0);
}

export default function DonateSuccessPage() {
  const searchParams = useSearchParams();
  const donationId = searchParams.get("donationId");

  const [status, setStatus] = useState<DonationStatusResponse["donation"] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
              <p><span className="font-bold">Amount:</span> {formatAmount(status.amount, status.currency)}</p>
              {status.receiptUrl && (
                <p>
                  <a href={status.receiptUrl} target="_blank" rel="noreferrer" className="font-bold text-accent hover:underline">
                    View Stripe receipt
                  </a>
                </p>
              )}
            </div>
          )}
          <div className="flex gap-4">
            <Link href="/donor/donations" className="btn-primary px-4 py-2 text-sm">View Donation History</Link>
            <Link href="/donate" className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary">Donate Again</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
