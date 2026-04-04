"use client";

import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DonateCancelPageContent() {
  const searchParams = useSearchParams();
  const donationId = searchParams.get("donationId");

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-grow px-6 py-24">
        <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-muted bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Checkout Cancelled</h1>
          <p className="text-sm text-muted-foreground">
            Your Razorpay checkout was cancelled. No payment was confirmed.
          </p>
          {donationId && (
            <p className="text-xs text-muted-foreground">
              Donation reference: <span className="font-mono">{donationId}</span>
            </p>
          )}
          <div className="flex gap-4">
            <Link href="/donate" className="btn-primary px-4 py-2 text-sm">Try Checkout Again</Link>
            <Link href="/campaigns" className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-primary">Back to Campaigns</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function DonateCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DonateCancelPageContent />
    </Suspense>
  );
}
