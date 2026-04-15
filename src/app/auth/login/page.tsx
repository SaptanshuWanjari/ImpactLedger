import LoginForm from "@/components/auth/LoginForm";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={14} />
              Secure Member Access
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tighter leading-none">
                Welcome Back to <br /> Impact Ledger.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Sign in to manage donations, monitor operations, and track campaign outcomes with full transparency.
              </p>
            </div>
            <div className="space-y-3">
              {[
                "Role-based dashboard routing after login",
                "Tenant-scoped access enforcement",
                "Webhook-backed payment transparency",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-primary">
                  <div className="w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                    <CheckCircle2 size={13} />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Need to explore first?{" "}
              <Link href="/campaigns" className="font-semibold text-accent hover:underline">
                Browse live campaigns
              </Link>
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Suspense fallback={<div className="w-full max-w-md rounded-2xl border border-muted bg-white p-8" />}>
              <LoginForm />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
