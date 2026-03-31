"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PaymentStepper from "@/components/PaymentStepper";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Wallet, Building2, ShieldCheck, Heart, ArrowRight, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchJson, useApiData } from "@/lib/api/client";
import { useSearchParams } from "next/navigation";

const steps = ["Amount", "Details", "Payment", "Review"];

const paymentMethods = [
  { id: "card", name: "Credit/Debit Card", icon: CreditCard, description: "Visa, Mastercard, Amex" },
  { id: "wallet", name: "Digital Wallets", icon: Wallet, description: "Apple Pay, Google Pay, PayPal" },
  { id: "bank", name: "Bank Transfer", icon: Building2, description: "Direct ACH or Wire Transfer" },
];

type CampaignsResponse = {
  campaigns: { id: string; title: string }[];
};

function DonatePageContent() {
  const searchParams = useSearchParams();
  const preselectedCampaignId = searchParams.get("campaignId");

  const { data } = useApiData<CampaignsResponse>("/api/campaigns");

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [fullName, setFullName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [campaignId, setCampaignId] = useState<string>(preselectedCampaignId || "general");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const amountNumber = useMemo(() => {
    const fromSelected = selectedAmount ? Number(selectedAmount.replace("$", "")) : 0;
    const fromCustom = customAmount ? Number(customAmount) : 0;
    return fromCustom > 0 ? fromCustom : fromSelected;
  }, [selectedAmount, customAmount]);

  const finalAmountLabel = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amountNumber || 0);

  async function submitDonation() {
    setSubmitting(true);
    setResultMessage(null);

    try {
      const response = await fetchJson<{ checkoutUrl: string; donationId: string }>("/api/payments/checkout-session", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          email,
          amount: amountNumber,
          campaignId: campaignId === "general" ? null : campaignId,
          isAnonymous,
        }),
      });

      window.location.href = response.checkoutUrl;
    } catch (error) {
      setResultMessage((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <p className="text-accent font-bold uppercase tracking-widest text-xs">Secure Stewardship</p>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tighter leading-none">Fund the Mission.</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">Your contribution is transparent and API-verified.</p>
          </div>

          <PaymentStepper currentStep={currentStep} steps={steps} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 no-line-card p-8 md:p-12 bg-white shadow-2xl border border-muted ring-1 ring-black/5 min-h-[500px] flex flex-col">
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 grow">
                    <h3 className="text-2xl font-display font-bold">Select Donation Amount</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {["₹100", "₹500", "₹1000", "₹2000"].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => {
                            setSelectedAmount(amount);
                            setCustomAmount("");
                          }}
                          className={cn(
                            "py-6 rounded-2xl font-display font-bold text-xl transition-all border-2",
                            selectedAmount === amount ? "bg-primary text-white border-primary shadow-lg scale-105" : "bg-muted/30 border-transparent hover:bg-muted/50",
                          )}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-display font-bold text-2xl text-muted-foreground">$</span>
                      <input type="number" placeholder="Custom Amount" value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }} className="w-full pl-12 pr-6 py-6 bg-muted/30 border-none rounded-2xl font-display font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all" />
                    </div>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex-grow">
                    <h3 className="text-2xl font-display font-bold">Your Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all" />
                      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all" />
                    </div>
                    <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all">
                      <option value="general">General Impact Fund</option>
                      {(data?.campaigns || []).map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-3 text-sm">
                      <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                      Make this donation anonymous
                    </label>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex-grow">
                    <h3 className="text-2xl font-display font-bold">Payment Method</h3>
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <button key={method.id} onClick={() => setSelectedMethod(method.id)} className={cn("w-full flex items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left", selectedMethod === method.id ? "bg-primary/5 border-primary shadow-sm" : "bg-white border-muted hover:bg-muted/30")}>
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", selectedMethod === method.id ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                            <method.icon size={24} />
                          </div>
                          <div className="flex-grow">
                            <p className="font-bold">{method.name}</p>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          </div>
                          {selectedMethod === method.id && <CheckCircle2 size={16} className="text-accent" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex-grow text-center">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck size={40} />
                    </div>
                    <h3 className="text-3xl font-display font-bold">Review & Confirm</h3>
                    <div className="bg-muted/30 p-8 rounded-3xl space-y-4 max-w-md mx-auto text-left">
                      <div className="flex justify-between"><span>Amount</span><span className="font-bold">{finalAmountLabel}</span></div>
                      <div className="flex justify-between"><span>Donor</span><span className="font-bold">{fullName}</span></div>
                      <div className="flex justify-between"><span>Method</span><span className="font-bold">{paymentMethods.find((m) => m.id === selectedMethod)?.name}</span></div>
                    </div>
                    {resultMessage && <p className="text-sm text-muted-foreground">{resultMessage}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-12 mt-auto border-t border-muted">
                <button onClick={prevStep} disabled={currentStep === 0} className={cn("flex items-center gap-2 text-sm font-bold transition-all", currentStep === 0 ? "opacity-0 pointer-events-none" : "text-muted-foreground hover:text-primary")}>
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  onClick={async () => {
                    if (currentStep === steps.length - 1) {
                      await submitDonation();
                      return;
                    }
                    nextStep();
                  }}
                  disabled={submitting || amountNumber <= 0}
                  className="btn-primary flex items-center gap-2 py-3 px-8 disabled:opacity-50"
                >
                  {currentStep === steps.length - 1 ? (submitting ? "Submitting..." : "Finalize Stewardship") : "Continue"}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="no-line-card p-8 bg-primary text-primary-foreground">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white">
                    <Heart size={24} fill="currentColor" />
                  </div>
                  <h4 className="font-display font-bold text-xl">Monthly Impact</h4>
                </div>
                <p className="text-3xl font-display font-extrabold text-blue-400">{finalAmountLabel}</p>
              </div>

              <div className="no-line-card p-6 border border-muted flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                  <Lock size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Secure Verification</p>
                  <p className="text-xs text-muted-foreground">Stripe Checkout securely handles payment and webhook verification.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function DonatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DonatePageContent />
    </Suspense>
  );
}
