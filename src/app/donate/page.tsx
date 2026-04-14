"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  CheckCircle2,
  CreditCard,
  HeartHandshake,
  Lock,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { fetchJson, useApiData } from "@/lib/api/client";

type CampaignsResponse = {
  campaigns: { id: string; title: string }[];
};

type RazorpaySuccessPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type CheckoutResponse = {
  donationId: string;
  manual: boolean;
  checkout?: {
    key: string;
    orderId: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    prefill: {
      name: string;
      email: string;
    };
    notes?: Record<string, string>;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const amountOptions = [500, 1000, 2000, 5000];

function loadRazorpayCheckoutScript() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function DonatePageContent() {
  const searchParams = useSearchParams();
  const preselectedCampaignId = searchParams.get("campaignId");

  const { data } = useApiData<CampaignsResponse>("/api/campaigns");

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"card" | "upi">("upi");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [campaignId, setCampaignId] = useState<string>(preselectedCampaignId || "general");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const amountNumber = useMemo(() => {
    const fromCustom = customAmount ? Number(customAmount) : 0;
    return fromCustom > 0 ? Math.floor(fromCustom) : selectedAmount;
  }, [customAmount, selectedAmount]);

  const amountLabel = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountNumber || 0);

  const hasValidAmount = Number.isFinite(amountNumber) && amountNumber > 0;
  const hasValidName = fullName.trim().length >= 2;
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const hasValidPhone = !phone.trim() || /^\+?[\d\s-]{8,16}$/.test(phone.trim());
  const hasValidDetails = hasValidName && hasValidEmail && hasValidPhone;

  async function submitDonation() {
    if (!hasValidAmount || !hasValidDetails) {
      setResultMessage("Complete amount and contact details before payment.");
      return;
    }

    setSubmitting(true);
    setResultMessage(null);

    try {
      const response = await fetchJson<CheckoutResponse>("/api/payments/checkout-session", {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          amount: amountNumber,
          campaignId: campaignId === "general" ? null : campaignId,
          paymentMethod: selectedMethod,
          isAnonymous,
          provider: "razorpay",
        }),
      });

      if (!response.checkout) {
        throw new Error("Checkout details are missing from the payment response.");
      }

      const scriptLoaded = await loadRazorpayCheckoutScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout script.");
      }

      const razorpay = new window.Razorpay({
        key: response.checkout.key,
        order_id: response.checkout.orderId,
        amount: response.checkout.amount,
        currency: response.checkout.currency,
        name: response.checkout.name,
        description: response.checkout.description,
        prefill: response.checkout.prefill,
        notes: response.checkout.notes || {},
        method: {
          upi: true,
          card: true,
          netbanking: false,
          wallet: false,
          emi: false,
          paylater: false,
        },
        config: {
          display: {
            blocks: {
              card: {
                name: "Pay by Card",
                instruments: [{ method: "card" }],
              },
              upi: {
                name: "Pay via UPI",
                instruments: [{ method: "upi" }],
              },
            },
            sequence: selectedMethod === "card" ? ["block.card", "block.upi"] : ["block.upi", "block.card"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        handler: async (paymentResult: RazorpaySuccessPayload) => {
          await fetchJson("/api/payments/verify", {
            method: "POST",
            body: JSON.stringify({
              donationId: response.donationId,
              razorpayPaymentId: paymentResult.razorpay_payment_id,
              razorpayOrderId: paymentResult.razorpay_order_id,
              razorpaySignature: paymentResult.razorpay_signature,
            }),
          });

          window.location.href = `/donate/success?donationId=${encodeURIComponent(response.donationId)}`;
        },
        modal: {
          ondismiss: () => {
            window.location.href = `/donate/cancel?donationId=${encodeURIComponent(response.donationId)}`;
          },
        },
        theme: {
          color: "#0b4abf",
        },
      });

      razorpay.open();
    } catch (error) {
      setResultMessage((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (currentStep === 1 && !hasValidAmount) {
      setResultMessage("Please select a valid amount.");
      return;
    }
    if (currentStep === 2 && !hasValidDetails) {
      setResultMessage("Please provide valid contact details.");
      return;
    }

    setResultMessage(null);
    setCurrentStep((prev) => Math.min(3, prev + 1));
  }

  function goBack() {
    setResultMessage(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }

  return (
    <div className="min-h-screen bg-[#f2f4f7] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="text-xl font-bold text-[#1b4bb3]">Ethos Management</Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
            <Link href="/impact" className="hover:text-slate-900">Impact</Link>
            <Link href="/campaigns" className="hover:text-slate-900">Programs</Link>
            <Link href="/transparency" className="hover:text-slate-900">Reports</Link>
            <Link href="/donate" className="rounded-full bg-[#0b4abf] px-5 py-2 font-semibold text-white">Donate Now</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-10">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">Support Our Mission</h1>
        </section>

        <section className="mx-auto mt-8 max-w-3xl">
          <div className="grid grid-cols-3 items-center gap-4 text-center">
            {[1, 2, 3].map((step) => {
              const done = step < currentStep;
              const active = step === currentStep;
              return (
                <div key={step} className="relative">
                  <div
                    className={cn(
                      "mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold",
                      done ? "border-green-600 bg-green-600 text-white" : active ? "border-[#0b4abf] bg-[#0b4abf] text-white" : "border-slate-200 bg-slate-100 text-slate-500",
                    )}
                  >
                    {done ? <Check size={16} /> : step}
                  </div>
                  <p className={cn("text-xs font-semibold", active ? "text-[#0b4abf]" : done ? "text-green-700" : "text-slate-500")}>{step === 1 ? "Amount" : step === 2 ? "Details" : "Payment"}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-8">
            {currentStep === 1 && (
              <div className="space-y-7">
                <h2 className="text-4xl font-bold tracking-tight text-slate-800">Choose an amount</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {amountOptions.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount("");
                      }}
                      className={cn(
                        "rounded-xl border p-5 text-left transition",
                        selectedAmount === amount && !customAmount
                          ? "border-[#0b4abf] bg-[#eff5ff] shadow-sm"
                          : "border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <p className="text-4xl font-extrabold tracking-tight">₹{amount.toLocaleString("en-IN")}</p>
                      <p className="mt-1 text-sm text-slate-600">{amount === 500 ? "Basic Support" : amount === 1000 ? "Standard Contribution" : amount === 2000 ? "Impact Builder" : "Visionary Patron"}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Or Enter Custom Amount</p>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    className="h-12 rounded-lg border-slate-300 bg-slate-50"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-7">
                <h2 className="text-4xl font-bold tracking-tight text-slate-800">Your Information</h2>
                <p className="text-sm text-slate-600">Please provide your contact details. This information ensures your contribution is properly recorded and acknowledged.</p>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Full name"
                    className="h-12 rounded-lg border-slate-300 bg-slate-50"
                  />
                  <Input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-12 rounded-lg border-slate-300 bg-slate-50"
                  />
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email address"
                    className="h-12 rounded-lg border-slate-300 bg-slate-50 md:col-span-2"
                  />
                  <select
                    value={campaignId}
                    onChange={(event) => setCampaignId(event.target.value)}
                    className="h-12 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 md:col-span-2"
                  >
                    <option value="general">General Impact Fund</option>
                    {(data?.campaigns || []).map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(event) => setIsAnonymous(event.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-semibold">Make this donation anonymous</span>
                    <span className="mt-1 block text-slate-500">Your name will not be displayed on our public donor wall or annual reports.</span>
                  </span>
                </label>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-7">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Complete Your Donation</h2>

                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("card")}
                    className={cn(
                      "rounded-lg px-3 py-3 text-sm font-semibold",
                      selectedMethod === "card" ? "bg-white text-[#0b4abf] shadow" : "text-slate-600",
                    )}
                  >
                    <span className="inline-flex items-center gap-2"><CreditCard size={14} /> Card Payment</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("upi")}
                    className={cn(
                      "rounded-lg px-3 py-3 text-sm font-semibold",
                      selectedMethod === "upi" ? "bg-white text-[#0b4abf] shadow" : "text-slate-600",
                    )}
                  >
                    <span className="inline-flex items-center gap-2"><QrCode size={14} /> UPI / QR Code</span>
                  </button>
                </div>

                {selectedMethod === "card" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
                      <Input placeholder="1234 5678 1234 5678" className="h-12 rounded-lg border-slate-300 bg-slate-50" />
                      <Input placeholder="MM/YY   CVV" className="h-12 rounded-lg border-slate-300 bg-slate-50" />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Input placeholder="Cardholder Name" className="h-12 rounded-lg border-slate-300 bg-slate-50" />
                      <Input placeholder="Postal Code" className="h-12 rounded-lg border-slate-300 bg-slate-50" />
                    </div>
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                      Or pay with UPI from Razorpay checkout after clicking complete payment.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[220px_1fr]">
                    <div className="rounded-xl bg-white p-3">
                      <img src="/GPAY_QR.jpeg" alt="UPI QR" className="w-full rounded-lg object-cover" />
                      <p className="mt-2 text-center text-xs font-semibold text-slate-600">Scan with any UPI app</p>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">Scan with any UPI App</h3>
                      <p className="mt-2 text-sm text-slate-600">Open your preferred UPI application (GPay, PhonePe, Paytm, BHIM) and scan the QR code. You can also continue to Razorpay UPI checkout.</p>
                      <div className="mt-4 inline-flex items-center rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-800">
                        Encrypted end-to-end UPI payment processing
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {resultMessage && <p className="mt-5 text-sm text-rose-600">{resultMessage}</p>}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-green-700"><ShieldCheck size={16} /> Secure & Tax-Exempt (80G)</p>
              <div className="flex items-center gap-3">
                {currentStep > 1 && (
                  <button type="button" onClick={goBack} className="rounded-full px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                    Go Back
                  </button>
                )}
                {currentStep < 3 ? (
                  <button type="button" onClick={goNext} className="rounded-full bg-[#0b4abf] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#083b99]">
                    {currentStep === 1 ? "Continue" : "Proceed to Payment"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitDonation}
                    disabled={submitting}
                    className="rounded-full bg-[#0b4abf] px-7 py-2.5 text-sm font-semibold text-white hover:bg-[#083b99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Opening Checkout..." : selectedMethod === "card" ? "Complete Payment" : "I've Paid"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-bold">Donation Summary</h3>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-500">Selected Amount</span><span className="font-semibold">{amountLabel}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Program</span><span className="font-semibold">{campaignId === "general" ? "Primary Support Fund" : "Campaign Contribution"}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Payment</span><span className="font-semibold">{selectedMethod === "card" ? "Card Payment" : "UPI / QR Code"}</span></div>
              </div>
              <div className="mt-5 border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-4xl font-extrabold tracking-tight text-[#0b4abf]">{amountLabel}</p>
              </div>
              <div className="mt-4 rounded-lg bg-green-50 p-3 text-xs text-green-800">
                This donation supports verified field programs and tax documentation.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><CheckCircle2 size={14} /> Transparency First</p>
              <p className="mt-1 text-xs text-slate-500">95% of every rupee donated goes directly to field programs.</p>
            </div>

            <p className="inline-flex items-center gap-2 text-xs text-slate-500"><Lock size={13} /> All transactions are encrypted and secured.</p>
          </aside>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Ethos Management. Built for Global Impact.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="hover:text-slate-700">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-700">Terms of Service</Link>
            <Link href="/about" className="hover:text-slate-700">Contact Us</Link>
            <Link href="/transparency" className="hover:text-slate-700">Annual Report</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function DonatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f2f4f7]" />}>
      <DonatePageContent />
    </Suspense>
  );
}
