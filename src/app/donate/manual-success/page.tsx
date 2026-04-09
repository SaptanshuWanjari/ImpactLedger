"use client";

import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ManualSuccessPageContent() {
  const searchParams = useSearchParams();
  const donationId = searchParams.get("donationId");

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-grow px-6 py-24">
        <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-muted bg-white p-8 shadow-sm text-center">
          <div className="w-20 h-20 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
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

export default function ManualSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ManualSuccessPageContent />
    </Suspense>
  );
}
