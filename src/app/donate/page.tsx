"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PaymentStepper from "@/components/PaymentStepper";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Wallet, 
  Building2, 
  ShieldCheck, 
  Heart, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Lock,
  Globe
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const steps = ["Amount", "Details", "Payment", "Review"];

const paymentMethods = [
  { id: "card", name: "Credit/Debit Card", icon: CreditCard, description: "Visa, Mastercard, Amex" },
  { id: "wallet", name: "Digital Wallets", icon: Wallet, description: "Apple Pay, Google Pay, PayPal" },
  { id: "bank", name: "Bank Transfer", icon: Building2, description: "Direct ACH or Wire Transfer" },
];

export default function DonatePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("card");

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const finalAmount = selectedAmount || customAmount || "0";

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <p className="text-accent font-bold uppercase tracking-widest text-xs">Secure Stewardship</p>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tighter leading-none">
              Fund the Mission.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Your contribution is 100% transparent and directly allocated to global impact missions.
            </p>
          </div>

          <PaymentStepper currentStep={currentStep} steps={steps} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            {/* Main Flow */}
            <div className="lg:col-span-2 no-line-card p-8 md:p-12 bg-white shadow-2xl border border-muted ring-1 ring-black/5 min-h-[500px] flex flex-col">
              <AnimatePresence mode="wait">
                {currentStep === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 flex-grow"
                  >
                    <div className="space-y-4">
                      <h3 className="text-2xl font-display font-bold">Select Donation Amount</h3>
                      <p className="text-muted-foreground">Choose a preset amount or enter a custom value.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {["$25", "$50", "$100", "$250"].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}
                          className={cn(
                            "py-6 rounded-2xl font-display font-bold text-xl transition-all border-2",
                            selectedAmount === amount 
                              ? "bg-primary text-white border-primary shadow-lg scale-105" 
                              : "bg-muted/30 border-transparent hover:bg-muted/50"
                          )}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-display font-bold text-2xl text-muted-foreground">$</span>
                      <input 
                        type="number" 
                        placeholder="Custom Amount" 
                        value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                        className="w-full pl-12 pr-6 py-6 bg-muted/30 border-none rounded-2xl font-display font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-accent/5 rounded-2xl border border-accent/10">
                      <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white">
                        <Globe size={20} />
                      </div>
                      <p className="text-sm font-medium text-accent">
                        A donation of {finalAmount} provides clean water to 5 families for a month.
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 flex-grow"
                  >
                    <div className="space-y-4">
                      <h3 className="text-2xl font-display font-bold">Your Details</h3>
                      <p className="text-muted-foreground">Tell us who is making this impact.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
                        <input type="text" placeholder="John Doe" className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                        <input type="email" placeholder="john@example.com" className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mission Preference (Optional)</label>
                      <select className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all">
                        <option>General Impact Fund</option>
                        <option>Clean Water Initiative</option>
                        <option>Emergency Relief: Cyclone</option>
                        <option>Youth Education Fund</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="anonymous" className="w-4 h-4 rounded border-muted text-accent focus:ring-accent" />
                      <label htmlFor="anonymous" className="text-sm font-medium text-muted-foreground">Make this donation anonymous</label>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 flex-grow"
                  >
                    <div className="space-y-4">
                      <h3 className="text-2xl font-display font-bold">Payment Method</h3>
                      <p className="text-muted-foreground">Securely process your stewardship contribution.</p>
                    </div>
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={cn(
                            "w-full flex items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left",
                            selectedMethod === method.id 
                              ? "bg-primary/5 border-primary shadow-sm" 
                              : "bg-white border-muted hover:bg-muted/30"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            selectedMethod === method.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          )}>
                            <method.icon size={24} />
                          </div>
                          <div className="flex-grow">
                            <p className="font-bold">{method.name}</p>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          </div>
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                            selectedMethod === method.id ? "border-accent bg-accent text-white" : "border-muted"
                          )}>
                            {selectedMethod === method.id && <CheckCircle2 size={14} />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 flex-grow text-center"
                  >
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck size={40} />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-display font-bold">Review & Confirm</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Please review your stewardship details before we finalize the mission funding.
                      </p>
                    </div>
                    <div className="bg-muted/30 p-8 rounded-3xl space-y-4 max-w-md mx-auto text-left">
                      <div className="flex justify-between items-center border-b border-muted pb-4">
                        <span className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Amount</span>
                        <span className="text-2xl font-display font-extrabold">{finalAmount}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-muted pb-4">
                        <span className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Mission</span>
                        <span className="text-sm font-bold">General Impact Fund</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Method</span>
                        <span className="text-sm font-bold">Credit Card (**** 4242)</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      By clicking "Finalize Stewardship", you agree to our terms of transparency and fund allocation.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-12 mt-auto border-t border-muted">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={cn(
                    "flex items-center gap-2 text-sm font-bold transition-all",
                    currentStep === 0 ? "opacity-0 pointer-events-none" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    {steps.map((_, i) => (
                      <div key={i} className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        i === currentStep ? "bg-accent w-4" : "bg-muted"
                      )} />
                    ))}
                  </div>
                  <button
                    onClick={nextStep}
                    className="btn-primary flex items-center gap-2 py-3 px-8"
                  >
                    {currentStep === steps.length - 1 ? "Finalize Stewardship" : "Continue"} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className="space-y-6">
              <div className="no-line-card p-8 bg-primary text-primary-foreground">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white">
                    <Heart size={24} fill="currentColor" />
                  </div>
                  <h4 className="font-display font-bold text-xl">Monthly Impact</h4>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <p className="text-sm text-primary-foreground/70">Total Monthly Impact</p>
                    <p className="text-3xl font-display font-extrabold text-accent">{finalAmount}</p>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1 }}
                      className="h-full bg-accent"
                    />
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Verified by Regional Stewards",
                      "100% Transparency Guarantee",
                      "Real-time Impact Tracking",
                      "Secure SSL Encryption",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-xs font-medium">
                        <CheckCircle2 size={14} className="text-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="no-line-card p-6 border border-muted flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                  <Lock size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">Secure Verification</p>
                  <p className="text-xs text-muted-foreground">Your data is encrypted and never stored on our servers.</p>
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
